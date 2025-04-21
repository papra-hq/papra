import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { getUser } from '../app/auth/auth.models';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createUsersRepository } from '../users/users.repository';
import { organizationIdSchema } from './organization.schemas';
import { createOrganizationsRepository } from './organizations.repository';
import { checkIfUserCanCreateNewOrganization, createOrganization, ensureUserIsInOrganization } from './organizations.usecases';

export async function registerOrganizationsPrivateRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationsRoute(context);
  setupCreateOrganizationRoute(context);
  setupGetOrganizationRoute(context);
  setupUpdateOrganizationRoute(context);
  setupDeleteOrganizationRoute(context);
}

function setupGetOrganizationsRoute({ app, db }: RouteDefinitionContext) {
  app.get('/api/organizations', async (context) => {
    const { userId } = getUser({ context });

    const organizationsRepository = createOrganizationsRepository({ db });

    const { organizations } = await organizationsRepository.getUserOrganizations({ userId });

    return context.json({
      organizations,
    });
  });
}

function setupCreateOrganizationRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations',
    validateJsonBody(z.object({
      name: z.string().min(3).max(50),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { name } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      await checkIfUserCanCreateNewOrganization({ userId, config, organizationsRepository, usersRepository });

      const { organization } = await createOrganization({ userId, name, organizationsRepository });

      return context.json({
        organization,
      });
    },
  );
}

function setupGetOrganizationRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId',
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      return context.json({ organization });
    },
  );
}

function setupUpdateOrganizationRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId',
    validateJsonBody(z.object({
      name: z.string().min(3).max(50),
    })),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
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

function setupDeleteOrganizationRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId',
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await organizationsRepository.deleteOrganization({ organizationId });

      return context.body(null, 204);
    },
  );
}
