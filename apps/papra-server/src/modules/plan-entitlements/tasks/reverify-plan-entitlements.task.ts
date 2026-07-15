import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { PlanEntitlementDefinitionRegistry } from '../plan-entitlements.registry';
import type { TaskServices } from '../../tasks/tasks.services';
import { createLogger } from '../../shared/logger/logger';
import { createUsersRepository } from '../../users/users.repository';
import { createPlanEntitlementsRepository } from '../plan-entitlements.repository';
import { reverifyUserClaimedPlanEntitlements } from '../plan-entitlements.usecases';

const logger = createLogger({ namespace: 'plan-entitlements:tasks:reverifyPlanEntitlements' });

export async function registerReverifyPlanEntitlementsTask({
  taskServices,
  db,
  config,
  planEntitlementDefinitionRegistry,
}: {
  taskServices: TaskServices;
  db: Database;
  config: Config;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
}) {
  const taskName = 'reverify-plan-entitlements';
  const { cron, runOnStartup } = config.tasks.reverifyPlanEntitlements;

  taskServices.registerTask({
    taskName,
    handler: async () => {
      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      logger.info('Re-verified user-claimed plan entitlements');
    },
  });

  await taskServices.schedulePeriodicJob({
    scheduleId: `periodic-${taskName}`,
    taskName,
    cron,
    immediate: runOnStartup,
  });

  logger.info({ taskName, cron, runOnStartup }, 'Re-verify plan entitlements task registered');
}
