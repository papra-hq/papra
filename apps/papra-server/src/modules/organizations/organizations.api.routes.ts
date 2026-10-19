import type { ApiDependencies } from '../app/server.types';
import type { organizationsTable } from './organizations.table';
import { defineApiRoute } from '../api/api.routes';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import {
  createOrganizationContract,
  getDeletedOrganizationsContract,
  getOrganizationContract,
  getOrganizationsContract,
  softDeleteOrganizationContract,
  updateOrganizationContract,
} from './organizations.api.contracts';
import { createOrganizationsRepository } from './organizations.repository';
import {
  checkIfUserCanCreateNewOrganization,
  createOrganization,
  ensureUserIsInOrganization,
  softDeleteOrganization,
} from './organizations.usecases';

export function buildOrganizationsApiRoutes(deps: ApiDependencies) {
  return [
    setupGetOrganizationsRoute(deps),
    setupGetDeletedOrganizationsRoute(deps),
    setupCreateOrganizationRoute(deps),
    setupGetOrganizationRoute(deps),
    setupUpdateOrganizationRoute(deps),
    setupSoftDeleteOrganizationRoute(deps),
  ];
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
          organizations: organizations.map(serializeOrganization),
        },
      };
    },
  });
}

function setupGetDeletedOrganizationsRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: getDeletedOrganizationsContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:read'] }),
    handler: async ({ context: { userId } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizations } = await organizationsRepository.getUserDeletedOrganizations({
        userId,
      });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          organizations: organizations.map(serializeOrganization),
        },
      };
    },
  });
}

function setupCreateOrganizationRoute({
  resolveAuthenticationContext,
  db,
  config,
}: ApiDependencies) {
  return defineApiRoute({
    contract: createOrganizationContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:create'] }),
    handler: async ({ context: { userId }, body: { name } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      await checkIfUserCanCreateNewOrganization({
        userId,
        config,
        organizationsRepository,
        usersRepository,
      });

      const { organization } = await createOrganization({ userId, name, organizationsRepository });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          organization: serializeOrganization(organization),
        },
      };
    },
  });
}

function setupGetOrganizationRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: getOrganizationContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:read'] }),
    handler: async ({ context: { userId }, params: { organizationId } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organization } = await organizationsRepository.getOrganizationById({
        organizationId,
      });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          organization: organization && serializeOrganization(organization),
        },
      };
    },
  });
}

function setupUpdateOrganizationRoute({ resolveAuthenticationContext, db }: ApiDependencies) {
  return defineApiRoute({
    contract: updateOrganizationContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:update'] }),
    handler: async ({ context: { userId }, params: { organizationId }, body: { name } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { organization } = await organizationsRepository.updateOrganization({
        organizationId,
        organization: { name },
      });

      return {
        status: 200,
        contentType: 'application/json',
        body: {
          organization: organization && serializeOrganization(organization),
        },
      };
    },
  });
}

function setupSoftDeleteOrganizationRoute({
  resolveAuthenticationContext,
  db,
  config,
}: ApiDependencies) {
  return defineApiRoute({
    contract: softDeleteOrganizationContract,
    resolveContext: resolveAuthenticationContext({ apiKeyPermissions: ['organizations:delete'] }),
    handler: async ({ context: { userId }, params: { organizationId } }) => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await softDeleteOrganization({
        organizationId,
        deletedBy: userId,
        organizationsRepository,
        subscriptionsRepository,
        config,
      });

      return { status: 204 };
    },
  });
}

function serializeOrganization(organization: typeof organizationsTable.$inferSelect) {
  return {
    id: organization.id,
    name: organization.name,
    customerId: organization.customerId,
    deletedBy: organization.deletedBy,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
    deletedAt: organization.deletedAt?.toISOString() ?? null,
    scheduledPurgeAt: organization.scheduledPurgeAt?.toISOString() ?? null,
  };
}
