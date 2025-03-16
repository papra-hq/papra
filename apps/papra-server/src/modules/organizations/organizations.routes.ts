import type { ServerInstance } from '../app/server.types';
import { z } from 'zod';
import { getUser } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { organizationIdRegex } from './organizations.constants';
import { createOrganizationsRepository } from './organizations.repository';
import { createOrganization, ensureUserIsInOrganization } from './organizations.usecases';

export async function registerOrganizationsPrivateRoutes({ app }: { app: ServerInstance }) {
  setupGetOrganizationsRoute({ app });
  setupCreateOrganizationRoute({ app });
  setupGetOrganizationRoute({ app });
  setupUpdateOrganizationRoute({ app });
  setupDeleteOrganizationRoute({ app });
}

function setupGetOrganizationsRoute({ app }: { app: ServerInstance }) {
  app.get('/api/organizations', async (context) => {
    const { userId } = getUser({ context });
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
      const { userId } = getUser({ context });
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

function setupGetOrganizationRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      return context.json({ organization });
    },
  );
}

function setupUpdateOrganizationRoute({ app }: { app: ServerInstance }) {
  app.put(
    '/api/organizations/:organizationId',
    validateJsonBody(z.object({
      name: z.string().min(3).max(50),
    })),
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { name } = context.req.valid('json');
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organization } = await organizationsRepository.updateOrganization({ organizationId, organization: { name } });

      return context.json({
        organization,
      });
    },
  );
}

function setupDeleteOrganizationRoute({ app }: { app: ServerInstance }) {
  app.delete(
    '/api/organizations/:organizationId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await organizationsRepository.deleteOrganization({ organizationId });

      return context.body(null, 204);
    },
  );
}
