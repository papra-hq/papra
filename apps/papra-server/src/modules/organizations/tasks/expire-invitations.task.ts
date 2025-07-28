import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { TaskServices } from '../../tasks/tasks.services';
import { createLogger } from '../../shared/logger/logger';
import { createOrganizationsRepository } from '../organizations.repository';

const logger = createLogger({ namespace: 'organizations:tasks:expireInvitations' });

export async function registerExpireInvitationsTask({ taskServices, db, config }: { taskServices: TaskServices; db: Database; config: Config }) {
  const taskName = 'expire-invitations';
  const { cron, runOnStartup } = config.tasks.expireInvitations;

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const organizationsRepository = createOrganizationsRepository({ db });

      await organizationsRepository.updateExpiredPendingInvitationsStatus();

      logger.info('Updated expired pending invitations status');
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: `periodic-${taskName}`,
    taskName,
    cron,
    immediate: runOnStartup,
  });

  logger.info({ taskName, cron, runOnStartup }, 'Update expired pending invitations status task registered');
}
