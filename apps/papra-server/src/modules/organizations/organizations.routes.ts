import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { createForbiddenError } from '../app/auth/auth.errors';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createPlansRepository } from '../plans/plans.repository';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import { memberIdSchema, organizationIdSchema } from './organization.schemas';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationsRepository } from './organizations.repository';
import { checkIfUserCanCreateNewOrganization, createOrganization, ensureUserIsInOrganization, inviteMemberToOrganization, removeMemberFromOrganization, restoreOrganization, softDeleteOrganization, updateOrganizationMemberRole } from './organizations.usecases';

export function registerOrganizationsRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationsRoute(context);
  setupGetDeletedOrganizationsRoute(context);
  setupCreateOrganizationRoute(context);
  setupGetOrganizationRoute(context);
  setupUpdateOrganizationRoute(context);
  setupSoftDeleteOrganizationRoute(context);
  setupGetOrganizationMembersRoute(context);
  setupRemoveOrganizationMemberRoute(context);
  setupUpdateOrganizationMemberRoute(context);
  setupInviteOrganizationMemberRoute(context);
  setupGetMembershipRoute(context);
  setupGetOrganizationInvitationsRoute(context);
  setupRestoreOrganizationRoute(context);
}

function setupGetOrganizationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations',
    requireAuthentication({ apiKeyPermissions: ['organizations:read'] }),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizations } = await organizationsRepository.getUserOrganizations({ userId });

      return context.json({
        organizations,
      });
    },
  );
}

function setupGetDeletedOrganizationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/deleted',
    requireAuthentication({ apiKeyPermissions: ['organizations:read'] }),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizations } = await organizationsRepository.getUserDeletedOrganizations({ userId });

      return context.json({
        organizations,
      });
    },
  );
}

function setupCreateOrganizationRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations',
    requireAuthentication({ apiKeyPermissions: ['organizations:create'] }),
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
    requireAuthentication({ apiKeyPermissions: ['organizations:read'] }),
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
    requireAuthentication({ apiKeyPermissions: ['organizations:update'] }),
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

function setupSoftDeleteOrganizationRoute({ app, db, config }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId',
    requireAuthentication({ apiKeyPermissions: ['organizations:delete'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await softDeleteOrganization({ organizationId, deletedBy: userId, organizationsRepository, subscriptionsRepository, config });

      return context.body(null, 204);
    },
  );
}

function setupGetOrganizationMembersRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { members } = await organizationsRepository.getOrganizationMembers({ organizationId });

      return context.json({ members });
    },
  );
}

function setupRemoveOrganizationMemberRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/members/:memberId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      memberId: memberIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, memberId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await removeMemberFromOrganization({ memberId, userId, organizationId, organizationsRepository });

      return context.body(null, 204);
    },
  );
}

function setupUpdateOrganizationMemberRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/members/:memberId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      memberId: memberIdSchema,
    })),
    validateJsonBody(z.object({
      role: z.enum([ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.MEMBER]),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, memberId } = context.req.valid('param');
      const { role } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { member } = await updateOrganizationMemberRole({ memberId, organizationsRepository, userId, organizationId, role });

      return context.json({ member });
    },
  );
}

function setupGetMembershipRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members/me',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      const { member } = await organizationsRepository.getOrganizationMemberByUserId({ organizationId, userId });

      if (!member) {
        throw createForbiddenError();
      }

      return context.json({ member });
    },
  );
}

function setupInviteOrganizationMemberRoute({ app, db, config, emailsServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/members/invitations',
    requireAuthentication(),
    validateJsonBody(z.object({
      email: z.string().email().toLowerCase(),
      role: z.enum([ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.MEMBER]),
    })),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { email, role } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const plansRepository = createPlansRepository({ config });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await inviteMemberToOrganization({
        email,
        role,
        organizationId,
        organizationsRepository,
        subscriptionsRepository,
        plansRepository,
        inviterId: userId,
        expirationDelayDays: config.organizations.invitationExpirationDelayDays,
        maxInvitationsPerDay: config.organizations.maxUserInvitationsPerDay,
        emailsServices,
        config,
      });

      return context.body(null, 204);
    },
  );
}

function setupGetOrganizationInvitationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members/invitations',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      const { member } = await organizationsRepository.getOrganizationMemberByUserId({ organizationId, userId });

      if (!member || ![ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.OWNER].includes(member.role)) {
        throw createForbiddenError();
      }

      const { invitations } = await organizationsRepository.getOrganizationInvitations({ organizationId });

      return context.json({ invitations });
    },
  );
}

function setupRestoreOrganizationRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/restore',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await restoreOrganization({
        organizationId,
        restoredBy: userId,
        organizationsRepository,
      });

      return context.body(null, 204);
    },
  );
}
