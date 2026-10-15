import type { ApiDependencies } from '../app/server.types';
import { defineApiRoute } from '../api/api.routes';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createOrganizationTagContract, getOrganizationTagsContract } from './tags.api.contracts';
import { createTagCreationFailedError } from './tags.errors';
import { createTagsRepository } from './tags.repository';
import { createTag } from './tags.usecases';

export function buildTagsApiRoutes(deps: ApiDependencies) {
  return [setupGetOrganizationTagsRoute(deps), setupCreateOrganizationTagRoute(deps)];
}

function setupCreateOrganizationTagRoute({
  resolveAuthenticationContext,
  db,
  config,
}: ApiDependencies) {
  return defineApiRoute({
    contract: createOrganizationTagContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['tags:create'] }),
    handler: async ({
      context: { userId },
      params: { organizationId },
      body: { name, color, description },
    }) => {
      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tag } = await createTag({
        organizationId,
        name,
        color,
        description,
        config,
        tagsRepository,
      });

      if (!tag) {
        throw createTagCreationFailedError();
      }

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          tag: {
            ...tag,
            createdAt: tag.createdAt.toISOString(),
            updatedAt: tag.updatedAt.toISOString(),
          },
        },
      };
    },
  });
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
