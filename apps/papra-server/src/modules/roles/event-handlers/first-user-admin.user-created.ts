import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { Config } from '../../config/config.types';
import type { Logger } from '../../shared/logger/logger';
import { createLogger } from '../../shared/logger/logger';
import { createUsersRepository } from '../../users/users.repository';
import { ROLES } from '../roles.constants';
import { createRolesRepository } from '../roles.repository';

export function registerFirstUserAdminEventHandler({
  eventServices,
  config,
  logger = createLogger({ namespace: 'events:first-user-admin' }),
  db,
}: {
  eventServices: EventServices;
  config: Config;
  db: Database;
  logger?: Logger;
}) {
  const usersRepository = createUsersRepository({ db });
  const rolesRepository = createRolesRepository({ db });

  if (!config.auth.firstUserAsAdmin) {
    return;
  }

  eventServices.onEvent({
    eventName: 'user.created',
    handlerName: 'roles.assign-admin-to-first-user',
    handler: async ({ userId }) => {
      if (!config.auth.firstUserAsAdmin) {
        return;
      }

      const { userCount } = await usersRepository.getUserCount();

      if (userCount !== 1) {
        logger.debug({ userId, userCount }, 'User is not the first user, skipping admin assignment');
        return;
      }

      await rolesRepository.assignRoleToUser({ userId, role: ROLES.ADMIN });

      logger.info({ userId }, 'Admin role assigned to first user');
    },
  });
}
