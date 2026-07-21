import type { GlobalDependencies } from '../../app/server.types';
import { and, desc, eq, lte } from 'drizzle-orm';
import { createLogger } from '../../shared/logger/logger';
import { createBackupsRepository } from '../backups.repository';
import { createBackupsServices } from '../backups.services';
import { backupDestinationsTable, backupRunsTable } from '../backups.table';
import { unwrapCredentials } from '../backups.encryption.service';

const logger = createLogger({ namespace: 'backups:tasks:retention-cleanup' });

const TASK_NAME = 'backups.retention-cleanup';

// Run daily at 2 AM
const RETENTION_CLEANUP_CRON = '0 2 * * *';

type RunToDelete = {
  id: string;
  destinationId: string;
  organizationId: string;
  remoteFileId: string | null;
};

export async function registerBackupRetentionCleanupTask(deps: GlobalDependencies) {
  const { taskServices, config, db } = deps;

  const { retentionDays, maxRunsToKeepPerDestination } = config.backups;
  const isDayRetentionEnabled = retentionDays !== undefined && retentionDays > 0;
  const isCountRetentionEnabled =
    maxRunsToKeepPerDestination !== undefined && maxRunsToKeepPerDestination > 0;

  if (!config.backups.kek || (!isDayRetentionEnabled && !isCountRetentionEnabled)) {
    logger.info(
      'Backup retention cleanup disabled (BACKUPS_KEK unset, or neither BACKUPS_RETENTION_DAYS nor BACKUPS_MAX_RUNS_TO_KEEP_PER_DESTINATION configured)',
    );
    return;
  }

  await taskServices.registerTask({
    taskName: TASK_NAME,
    handler: async () => {
      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });

      const runsById = new Map<string, RunToDelete>();

      // Day-based: anything older than N days, regardless of how many runs exist.
      if (isDayRetentionEnabled) {
        const retentionMs = retentionDays! * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - retentionMs);

        const oldRuns = await db
          .select({
            id: backupRunsTable.id,
            destinationId: backupRunsTable.destinationId,
            organizationId: backupRunsTable.organizationId,
            remoteFileId: backupRunsTable.remoteFileId,
          })
          .from(backupRunsTable)
          .where(
            and(
              eq(backupRunsTable.status, 'succeeded'),
              lte(backupRunsTable.createdAt, cutoffDate),
            ),
          );

        for (const run of oldRuns) {
          runsById.set(run.id, run);
        }
      }

      // Count-based: keep only the N most recent succeeded runs per destination.
      // Every succeeded run is now a full, self-contained backup, so trimming
      // older ones never breaks the ability to restore from what's left.
      if (isCountRetentionEnabled) {
        const destinations = await db
          .select({
            id: backupDestinationsTable.id,
            organizationId: backupDestinationsTable.organizationId,
          })
          .from(backupDestinationsTable);

        for (const destination of destinations) {
          const runs = await db
            .select({
              id: backupRunsTable.id,
              destinationId: backupRunsTable.destinationId,
              organizationId: backupRunsTable.organizationId,
              remoteFileId: backupRunsTable.remoteFileId,
            })
            .from(backupRunsTable)
            .where(
              and(
                eq(backupRunsTable.destinationId, destination.id),
                eq(backupRunsTable.status, 'succeeded'),
              ),
            )
            .orderBy(desc(backupRunsTable.createdAt));

          const excessRuns = runs.slice(maxRunsToKeepPerDestination!);
          for (const run of excessRuns) {
            runsById.set(run.id, run);
          }
        }
      }

      let deletedCount = 0;
      let failedCount = 0;

      for (const run of runsById.values()) {
        try {
          // Delete the remote file first (best effort)
          if (run.remoteFileId) {
            try {
              const { destination } = await repository.getDestinationById({
                destinationId: run.destinationId,
                organizationId: run.organizationId,
              });

              if (destination) {
                const credentials = unwrapCredentials({
                  encryption: services.requireEncryption(),
                  wrapped: destination.encryptedCredentials,
                });
                const settings = JSON.parse(destination.settingsJson) as Record<string, unknown>;
                const driver = services.getDriver(destination.driver);
                await driver.deleteFile({
                  credentials,
                  settings,
                  remoteFileId: run.remoteFileId,
                });
              }
            } catch (error) {
              logger.warn(
                { error, runId: run.id },
                'Failed to delete remote backup file; continuing with local cleanup',
              );
            }
          }

          // Delete the local run record
          await db.delete(backupRunsTable).where(eq(backupRunsTable.id, run.id));

          deletedCount++;
        } catch (error) {
          logger.error({ error, runId: run.id }, 'Failed to clean up backup run');
          failedCount++;
        }
      }

      if (deletedCount > 0 || failedCount > 0) {
        logger.info({ deletedCount, failedCount }, 'Backup retention cleanup completed');
      }
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: TASK_NAME,
    taskName: TASK_NAME,
    cron: RETENTION_CLEANUP_CRON,
  });
}
