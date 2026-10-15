import type { ApiDependencies } from '../app/server.types';
import { defineApiRoute } from '../api/api.routes';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { getOrganizationTagsContract } from './tags.api.contracts';
import { createTagsRepository } from './tags.repository';

export function buildTagsApiRoutes(deps: ApiDependencies) {
  return [setupGetOrganizationTagsRoute(deps)];
}

function setupGetOrganizationTagsRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: getOrganizationTagsContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['tags:read'] }),
    handler: async ({ context: { userId }, params: { organizationId } }) => {
      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tags } = await tagsRepository.getOrganizationTags({ organizationId });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          tags: tags.map((tag) => ({
            ...tag,
            createdAt: tag.createdAt.toISOString(),
            updatedAt: tag.updatedAt.toISOString(),
          })),
        },
      };
    },
  });
}
