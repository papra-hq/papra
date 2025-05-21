import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { createForbiddenError } from '../app/auth/auth.errors';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createUsersRepository } from '../users/users.repository';
import { memberIdSchema, organizationIdSchema } from './organization.schemas';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationsRepository } from './organizations.repository';
import { checkIfUserCanCreateNewOrganization, createOrganization, ensureUserIsInOrganization, inviteMemberToOrganization, removeMemberFromOrganization } from './organizations.usecases';

export async function registerOrganizationsRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationsRoute(context);
  setupCreateOrganizationRoute(context);
  setupGetOrganizationRoute(context);
  setupUpdateOrganizationRoute(context);
  setupDeleteOrganizationRoute(context);
  setupGetOrganizationMembersRoute(context);
  setupRemoveOrganizationMemberRoute(context);
  setupInviteOrganizationMemberRoute(context);
  setupGetMembershipRoute(context);
}

function setupGetOrganizationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations',
    requireAuthentication(),
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

function setupCreateOrganizationRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations',
    requireAuthentication(),
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
    requireAuthentication(),
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
    requireAuthentication(),
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
    requireAuthentication(),
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

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await inviteMemberToOrganization({
        email,
        role,
        organizationId,
        organizationsRepository,
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
