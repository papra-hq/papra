import type { RouteDefinitionContext } from '../../app/server.types';
import { createRoleMiddleware, requireAuthentication } from '../../app/auth/auth.middleware';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { PERMISSIONS } from '../../roles/roles.constants';
import { createUsersRepository } from '../../users/users.repository';

export function registerAnalyticsRoutes(context: RouteDefinitionContext) {
  registerGetUserCountAdminRoute(context);
  registerGetDocumentStatsAdminRoute(context);
  registerGetOrganizationCountAdminRoute(context);
}

function registerGetUserCountAdminRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/users/count',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_ANALYTICS],
    }),
    async (context) => {
      const usersRepository = createUsersRepository({ db });

      const { userCount } = await usersRepository.getUserCount();

      return context.json({ userCount });
    },
  );
}

function registerGetDocumentStatsAdminRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/documents/stats',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_ANALYTICS],
    }),
    async (context) => {
      const documentsRepository = createDocumentsRepository({ db });

      const stats = await documentsRepository.getGlobalDocumentsStats();

      return context.json(stats);
    },
  );
}

function registerGetOrganizationCountAdminRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/count',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_ANALYTICS],
    }),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizationCount } = await organizationsRepository.getOrganizationCount();

      return context.json({ organizationCount });
    },
  );
}
