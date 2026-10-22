import type { ApiDependencies } from '../../app/server.types';
import { defineApiRoute } from '../../api/api.routes';
import { createUnauthorizedError } from '../../app/auth/auth.errors';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { PERMISSIONS } from '../../roles/roles.constants';
import { getPermissionsForRoles } from '../../roles/roles.methods';
import { createRolesRepository } from '../../roles/roles.repository';
import { createSubscriptionsRepository } from '../../subscriptions/subscriptions.repository';
import { adminSoftDeleteOrganizationContract } from './organizations.api.contracts';
import { buildAdminSoftDeleteOrganization } from './organizations.usecases';

export function buildAdminOrganizationsApiRoutes(deps: ApiDependencies) {
  return [setupAdminSoftDeleteOrganizationRoute(deps)];
}

function setupAdminSoftDeleteOrganizationRoute({
  resolveAuthenticationContext,
  db,
  config,
}: ApiDependencies) {
  const authenticate = resolveAuthenticationContext();
  const rolesRepository = createRolesRepository({ db });
  const softDeleteOrganization = buildAdminSoftDeleteOrganization({
    organizationsRepository: createOrganizationsRepository({ db }),
    subscriptionsRepository: createSubscriptionsRepository({ db }),
    config,
  });

  return defineApiRoute({
    contract: adminSoftDeleteOrganizationContract,
    resolveContext: async ({ request }) => {
      const context = await authenticate({ request });
      const { roles } = await rolesRepository.getUserRoles({ userId: context.userId });
      const { permissions } = getPermissionsForRoles({ roles });

      if (!permissions.includes(PERMISSIONS.DELETE_ORGANIZATIONS)) {
        throw createUnauthorizedError();
      }

      return context;
    },
    handler: async ({ context: { userId }, params: { organizationId } }) => {
      await softDeleteOrganization({ organizationId, deletedBy: userId });

      return { status: 204 };
    },
  });
}
