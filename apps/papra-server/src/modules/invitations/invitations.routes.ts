import type { RouteDefinitionContext } from '../app/server.types';
import z from 'zod';
import { createForbiddenError } from '../app/auth/auth.errors';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { invitationIdSchema } from '../organizations/organization.schemas';
import { ORGANIZATION_INVITATION_STATUS, ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { resendOrganizationInvitation } from '../organizations/organizations.usecases';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { validateParams } from '../shared/validation/validation';
import { createUsersRepository } from '../users/users.repository';

const logger = createLogger({ namespace: 'invitations' });

export function registerInvitationsRoutes(context: RouteDefinitionContext) {
  setupGetInvitationsRoute(context);
  setupAcceptInvitationRoute(context);
  setupRejectInvitationRoute(context);
  setupCancelInvitationRoute(context);
  setupGetPendingInvitationsCountRoute(context);
  setupResendInvitationRoute(context);
}

function setupGetInvitationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/invitations',
    requireAuthentication(),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.getUserByIdOrThrow({ userId });

      const { invitations } = await organizationsRepository.getPendingOrganizationInvitationsForEmail({ email: user.email.toLowerCase() });

      return context.json({ invitations });
    },
  );
}

function setupGetPendingInvitationsCountRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/invitations/count',
    requireAuthentication(),
    async (context) => {
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.getUserByIdOrThrow({ userId });

      const { pendingInvitationsCount } = await organizationsRepository.getPendingInvitationsCount({ email: user.email.toLowerCase() });

      return context.json({ pendingInvitationsCount });
    },
  );
}

function setupAcceptInvitationRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/invitations/:invitationId/accept',
    requireAuthentication(),
    validateParams(z.object({
      invitationId: invitationIdSchema,
    })),
    async (context) => {
      const { invitationId } = context.req.valid('param');
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.getUserByIdOrThrow({ userId });

      const { invitation } = await organizationsRepository.getOrganizationInvitationById({ invitationId });

      if (!invitation) {
        throw createError({
          code: 'invitations.not-found',
          message: 'Invitation not found',
          statusCode: 404,
        });
      }

      if (invitation.status !== ORGANIZATION_INVITATION_STATUS.PENDING) {
        throw createError({
          code: 'invitations.not-pending',
          message: 'Invitation is not pending',
          statusCode: 400,
        });
      }

      if (invitation.email !== user.email) {
        logger.error({ invitationId, invitationEmail: invitation.email, userId, userEmail: user.email }, 'User tried to accept invitation for another email');
        throw createForbiddenError();
      }

      await organizationsRepository.addUserToOrganization({
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      });

      await organizationsRepository.updateOrganizationInvitation({ invitationId, status: ORGANIZATION_INVITATION_STATUS.ACCEPTED });

      return context.body(null, 204);
    },
  );
}

function setupRejectInvitationRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/invitations/:invitationId/reject',
    requireAuthentication(),
    validateParams(z.object({
      invitationId: invitationIdSchema,
    })),
    async (context) => {
      const { invitationId } = context.req.valid('param');
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });

      const { user } = await usersRepository.getUserByIdOrThrow({ userId });

      const { invitation } = await organizationsRepository.getOrganizationInvitationById({ invitationId });

      if (!invitation) {
        throw createError({
          code: 'invitations.not-found',
          message: 'Invitation not found',
          statusCode: 404,
        });
      }

      if (invitation.email !== user.email) {
        logger.error({ invitationId, invitationEmail: invitation.email, userId, userEmail: user.email }, 'User tried to decline invitation for another email');
        throw createForbiddenError();
      }

      await organizationsRepository.updateOrganizationInvitation({ invitationId, status: ORGANIZATION_INVITATION_STATUS.REJECTED });

      return context.body(null, 204);
    },
  );
}

function setupCancelInvitationRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/invitations/:invitationId/cancel',
    requireAuthentication(),
    validateParams(z.object({
      invitationId: invitationIdSchema,
    })),
    async (context) => {
      const { invitationId } = context.req.valid('param');
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });

      const { invitation } = await organizationsRepository.getOrganizationInvitationById({ invitationId });

      if (!invitation) {
        throw createError({
          code: 'invitations.not-found',
          message: 'Invitation not found',
          statusCode: 404,
        });
      }

      const { member } = await organizationsRepository.getOrganizationMemberByUserId({ userId, organizationId: invitation.organizationId });

      if (!member || ![ORGANIZATION_ROLES.OWNER, ORGANIZATION_ROLES.ADMIN].includes(member.role)) {
        throw createForbiddenError();
      }

      await organizationsRepository.updateOrganizationInvitation({ invitationId, status: ORGANIZATION_INVITATION_STATUS.CANCELLED });

      return context.body(null, 204);
    },
  );
}

function setupResendInvitationRoute({ app, db, config, emailsServices }: RouteDefinitionContext) {
  app.post(
    '/api/invitations/:invitationId/resend',
    requireAuthentication(),
    validateParams(z.object({
      invitationId: invitationIdSchema,
    })),
    async (context) => {
      const { invitationId } = context.req.valid('param');
      const { userId } = getUser({ context });

      const organizationsRepository = createOrganizationsRepository({ db });

      await resendOrganizationInvitation({
        invitationId,
        userId,
        organizationsRepository,
        emailsServices,
        config,
      });

      return context.body(null, 204);
    },
  );
}
