import type { GlobalDependencies } from '../../app/server.types';
import { and, eq, lte, sub } from 'drizzle-orm';
import { createLogger } from '../../shared/logger/logger';
import { createBackupsRepository } from '../backups.repository';
import { createBackupsServices } from '../backups.services';
import { backupRunsTable } from '../backups.table';

const logger = createLogger({ namespace: 'backups:tasks:retention-cleanup' });

const TASK_NAME = 'backups.retention-cleanup';

// Run daily at 2 AM
const RETENTION_CLEANUP_CRON = '0 2 * * *';

export async function registerBackupRetentionCleanupTask(deps: GlobalDependencies) {
  const { taskServices, config, db } = deps;

  if (!config.backups.kek || config.backups.retentionDays === undefined || config.backups.retentionDays <= 0) {
    logger.info('Backup retention cleanup disabled (BACKUPS_KEK unset or BACKUPS_RETENTION_DAYS not configured)');
    return;
  }

  await taskServices.registerTask({
    taskName: TASK_NAME,
    handler: async () => {
      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });
      const retentionDays = config.backups.retentionDays!;
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - retentionMs);

      // Find all succeeded runs older than the retention period
      const runsToDelete = await db
        .select({
          id: backupRunsTable.id,
          destinationId: backupRunsTable.destinationId,
          organizationId: backupRunsTable.organizationId,
          remoteFileId: backupRunsTable.remoteFileId,
        })
        .from(backupRunsTable)
        .where(and(
          eq(backupRunsTable.status, 'succeeded'),
          lte(backupRunsTable.createdAt, cutoffDate),
        ));

      let deletedCount = 0;
      let failedCount = 0;

      for (const run of runsToDelete) {
        try {
          // Delete the remote file first (best effort)
          if (run.remoteFileId) {
            try {
              const { destination } = await repository.getDestinationById({ 
                destinationId: run.destinationId, 
                organizationId: run.organizationId 
              });
              
              if (destination) {
                const credentials = services.requireEncryption().unwrapCredentials({ 
                  wrapped: destination.encryptedCredentials 
                });
                const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
                const driver = services.getDriver(destination.driver);
                await driver.deleteFile({ 
                  credentials, 
                  settings, 
                  remoteFileId: run.remoteFileId 
                });
              }
            } catch (error) {
              logger.warn({ error, runId: run.id }, 'Failed to delete remote backup file; continuing with local cleanup');
            }
          }

          // Delete the local run record
          await db
            .delete(backupRunsTable)
            .where(eq(backupRunsTable.id, run.id));
          
          deletedCount++;
        } catch (error) {
          logger.error({ error, runId: run.id }, 'Failed to clean up backup run');
          failedCount++;
        }
      }

      if (deletedCount > 0 || failedCount > 0) {
        logger.info({ deletedCount, failedCount, cutoffDate: cutoffDate.toISOString() }, 'Backup retention cleanup completed');
      }
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: TASK_NAME,
    taskName: TASK_NAME,
    cron: RETENTION_CLEANUP_CRON,
  });
}
