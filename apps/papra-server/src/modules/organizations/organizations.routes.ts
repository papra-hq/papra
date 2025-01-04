import type { ServerInstance } from '../app/server.types';
import { z } from 'zod';
import { getAuthUserId } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { validateJsonBody } from '../shared/validation/validation';
import { createOrganizationsRepository } from './organizations.repository';
import { createOrganization } from './organizations.usecases';

export async function registerOrganizationsPrivateRoutes({ app }: { app: ServerInstance }) {
  setupGetOrganizationsRoute({ app });
  setupCreateOrganizationRoute({ app });
}

function setupGetOrganizationsRoute({ app }: { app: ServerInstance }) {
  app.get('/api/organizations', async (context) => {
    const { userId } = getAuthUserId({ context });
    const { db } = getDb({ context });

    const organizationsRepository = createOrganizationsRepository({ db });

    const { organizations } = await organizationsRepository.getUserOrganizations({ userId });

    return context.json({
      organizations,
    });
  });
}

function setupCreateOrganizationRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations',
    validateJsonBody(z.object({
      name: z.string().min(3).max(50),
    })),
    async (context) => {
      const { userId } = getAuthUserId({ context });
      const { db } = getDb({ context });
      const { name } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });

      const { organization } = await createOrganization({ userId, name, organizationsRepository });

      return context.json({
        organization,
      });
    },
  );
}
