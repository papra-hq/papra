import type { ServerInstance } from '../app/server.types';
import { pick } from 'lodash-es';
import { getAuthUserId } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { createRolesRepository } from '../roles/roles.repository';
import { createUsersRepository } from './users.repository';

export async function registerUsersPrivateRoutes({ app }: { app: ServerInstance }) {
  setupGetCurrentUserRoute({ app });
}

function setupGetCurrentUserRoute({ app }: { app: ServerInstance }) {
  app.get('/api/users/me', async (context) => {
    const { userId } = getAuthUserId({ context });
    const { db } = getDb({ context });

    const usersRepository = createUsersRepository({ db });
    const rolesRepository = createRolesRepository({ db });

    const [
      { user },
      { roles },
    ] = await Promise.all([
      usersRepository.getUserByIdOrThrow({ userId }),
      rolesRepository.getUserRoles({ userId }),
    ]);

    return context.json({
      user: {
        roles,
        ...pick(
          user,
          [
            'id',
            'email',
            'fullName',
            'createdAt',
            'updatedAt',
            'planId',
          ],
        ),
      },
    });
  });
}
