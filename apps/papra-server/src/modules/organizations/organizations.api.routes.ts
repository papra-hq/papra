import type { ApiDependencies } from '../app/server.types';
import { defineApiRoute } from '../api/api.routes';
import { getOrganizationsContract } from './organizations.api.contracts';
import { createOrganizationsRepository } from './organizations.repository';

export function buildOrganizationsApiRoutes(deps: ApiDependencies) {
  return [setupGetOrganizationsRoute(deps)];
}

function setupGetOrganizationsRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: getOrganizationsContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:read'] }),
    handler: async ({ context: { userId } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizations } = await organizationsRepository.getUserOrganizations({ userId });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          organizations: organizations.map((organization) => ({
            ...organization,
            createdAt: organization.createdAt.toISOString(),
            updatedAt: organization.updatedAt.toISOString(),
            deletedAt: organization.deletedAt?.toISOString() ?? null,
            scheduledPurgeAt: organization.scheduledPurgeAt?.toISOString() ?? null,
          })),
        },
      };
    },
  });
}
