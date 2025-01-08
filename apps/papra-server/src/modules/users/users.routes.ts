import type { ServerInstance } from '../app/server.types';
import { pick } from 'lodash-es';
import { z } from 'zod';
import { getAuthUserId } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { createRolesRepository } from '../roles/roles.repository';
import { validateJsonBody } from '../shared/validation/validation';
import { createUsersRepository } from './users.repository';

export async function registerUsersPrivateRoutes({ app }: { app: ServerInstance }) {
  setupGetCurrentUserRoute({ app });
  setupUpdateUserRoute({ app });
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

function setupUpdateUserRoute({ app }: { app: ServerInstance }) {
  app.put(
    '/api/users/me',
    validateJsonBody(z.object({
      fullName: z.string().min(1).max(50),
    })),
    async (context) => {
      const { userId } = getAuthUserId({ context });
      const { db } = getDb({ context });

      const { fullName } = context.req.valid('json');

      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.updateUser({ userId, fullName });

      return context.json({ user });
    },
  );
}
