import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createViewNotFoundError } from './views.errors';
import { createViewsRepository } from './views.repository';
import { viewIdSchema } from './views.schemas';

export function registerViewsRoutes(context: RouteDefinitionContext) {
  setupCreateViewRoute(context);
  setupGetOrganizationViewsRoute(context);
  setupUpdateViewRoute(context);
  setupDeleteViewRoute(context);
}

function setupCreateViewRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/views',
    requireAuthentication(),
    validateParams(z.object({ organizationId: organizationIdSchema })),
    validateJsonBody(z.object({
      name: z.string().trim().min(1).max(100),
      query: z.string().trim().min(1).max(500),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { name, query } = context.req.valid('json');

      const viewsRepository = createViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { view } = await viewsRepository.createView({ view: { organizationId, name, query } });

      return context.json({ view });
    },
  );
}

function setupGetOrganizationViewsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/views',
    requireAuthentication(),
    validateParams(z.object({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const viewsRepository = createViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { views } = await viewsRepository.getOrganizationViews({ organizationId });

      return context.json({ views });
    },
  );
}

function setupUpdateViewRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/views/:viewId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      viewId: viewIdSchema,
    })),
    validateJsonBody(z.object({
      name: z.string().trim().min(1).max(100).optional(),
      query: z.string().trim().min(1).max(500).optional(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, viewId } = context.req.valid('param');
      const { name, query } = context.req.valid('json');

      const viewsRepository = createViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { view: existing } = await viewsRepository.getViewById({ viewId, organizationId });

      if (!existing) {
        throw createViewNotFoundError();
      }

      const { view } = await viewsRepository.updateView({ viewId, name, query });

      return context.json({ view });
    },
  );
}

function setupDeleteViewRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/views/:viewId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      viewId: viewIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, viewId } = context.req.valid('param');

      const viewsRepository = createViewsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { view: existing } = await viewsRepository.getViewById({ viewId, organizationId });

      if (!existing) {
        throw createViewNotFoundError();
      }

      await viewsRepository.deleteView({ viewId });

      return context.body(null, 204);
    },
  );
}
