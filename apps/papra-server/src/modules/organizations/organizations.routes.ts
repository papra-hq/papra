import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { createForbiddenError } from '../app/auth/auth.errors';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createPlanEntitlementsRepository } from '../plan-entitlements/plan-entitlements.repository';
import { createPlansRepository } from '../plans/plans.repository';
import { createGetOrganizationPlanUsecase } from '../plans/plans.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import {
  assignableOrganizationRoleSchema,
  memberIdSchema,
  organizationIdSchema,
} from './organization.schemas';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationsRepository } from './organizations.repository';
import {
  buildInviteMemberToOrganization,
  checkIfUserHasReachedOrganizationInvitationLimit,
  ensureUserIsInOrganization,
  removeMemberFromOrganization,
  restoreOrganization,
  sendOrganizationInvitationEmail,
  updateOrganizationMemberRole,
} from './organizations.usecases';

export function registerOrganizationsRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationMembersRoute(context);
  setupRemoveOrganizationMemberRoute(context);
  setupUpdateOrganizationMemberRoute(context);
  setupInviteOrganizationMemberRoute(context);
  setupGetMembershipRoute(context);
  setupGetOrganizationInvitationsRoute(context);
  setupRestoreOrganizationRoute(context);
}

function setupGetOrganizationMembersRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
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
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
        memberId: memberIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, memberId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await removeMemberFromOrganization({
        memberId,
        userId,
        organizationId,
        organizationsRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupUpdateOrganizationMemberRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/members/:memberId',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
        memberId: memberIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        role: assignableOrganizationRoleSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, memberId } = context.req.valid('param');
      const { role } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { member } = await updateOrganizationMemberRole({
        memberId,
        organizationsRepository,
        userId,
        organizationId,
        role,
      });

      return context.json({ member });
    },
  );
}

function setupGetMembershipRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members/me',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      const { member } = await organizationsRepository.getOrganizationMemberByUserId({
        organizationId,
        userId,
      });

      if (!member) {
        throw createForbiddenError();
      }

      return context.json({ member });
    },
  );
}

function setupInviteOrganizationMemberRoute({
  app,
  db,
  config,
  emailsServices,
  planEntitlementDefinitionRegistry,
}: RouteDefinitionContext) {
  const organizationsRepository = createOrganizationsRepository({ db });
  const inviteMemberToOrganization = buildInviteMemberToOrganization({
    organizationsRepository,
    getOrganizationPlan: createGetOrganizationPlanUsecase({
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      plansRepository: createPlansRepository({ config }),
      planEntitlementsRepository: createPlanEntitlementsRepository({ db }),
      planEntitlementDefinitionRegistry,
    }),
    checkIfUserHasReachedOrganizationInvitationLimit: async ({ userId, now }) =>
      checkIfUserHasReachedOrganizationInvitationLimit({
        userId,
        now,
        maxInvitationsPerDay: config.organizations.maxUserInvitationsPerDay,
        organizationsRepository,
      }),
    sendOrganizationInvitationEmail: async ({ email, organizationId }) =>
      sendOrganizationInvitationEmail({
        email,
        organizationId,
        organizationsRepository,
        emailsServices,
        config,
      }),
    expirationDelayDays: config.organizations.invitationExpirationDelayDays,
  });

  app.post(
    '/api/organizations/:organizationId/members/invitations',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    validateJsonBody(
      v.strictObject({
        email: v.pipe(v.string(), v.email(), v.toLowerCase()),
        role: assignableOrganizationRoleSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { email, role } = context.req.valid('json');

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await inviteMemberToOrganization({
        email,
        role,
        organizationId,
        inviterId: userId,
      });

      return context.body(null, 204);
    },
  );
}

function setupGetOrganizationInvitationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/members/invitations',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });

      const { member } = await organizationsRepository.getOrganizationMemberByUserId({
        organizationId,
        userId,
      });

      if (!member || ![ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.OWNER].includes(member.role)) {
        throw createForbiddenError();
      }

      const { invitations } = await organizationsRepository.getOrganizationInvitations({
        organizationId,
      });

      return context.json({ invitations });
    },
  );
}

function setupRestoreOrganizationRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/restore',
    requireAuthentication(),
    validateParams(
      v.strictObject({
        organizationId: organizationIdSchema,
      }),
    ),
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
