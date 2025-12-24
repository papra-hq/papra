import type { RouteDefinitionContext } from '../../app/server.types';
import { z } from 'zod';
import { createRoleMiddleware, requireAuthentication } from '../../app/auth/auth.middleware';
import { createIntakeEmailsRepository } from '../../intake-emails/intake-emails.repository';
import { organizationIdSchema } from '../../organizations/organization.schemas';
import { createOrganizationNotFoundError } from '../../organizations/organizations.errors';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { PERMISSIONS } from '../../roles/roles.constants';
import { validateParams, validateQuery } from '../../shared/validation/validation';
import { createWebhookRepository } from '../../webhooks/webhook.repository';

export function registerOrganizationManagementRoutes(context: RouteDefinitionContext) {
  registerListOrganizationsRoute(context);
  registerGetOrganizationBasicInfoRoute(context);
  registerGetOrganizationMembersRoute(context);
  registerGetOrganizationIntakeEmailsRoute(context);
  registerGetOrganizationWebhooksRoute(context);
  registerGetOrganizationStatsRoute(context);
}

function registerListOrganizationsRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateQuery(
      z.object({
        search: z.string().optional(),
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(25),
      }),
    ),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { search, pageIndex, pageSize } = context.req.valid('query');

      const { organizations, totalCount } = await organizationsRepository.listOrganizations({
        search,
        pageIndex,
        pageSize,
      });

      return context.json({
        organizations,
        totalCount,
        pageIndex,
        pageSize,
      });
    },
  );
}

function registerGetOrganizationBasicInfoRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/:organizationId',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizationId } = context.req.valid('param');

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      return context.json({ organization });
    },
  );
}

function registerGetOrganizationMembersRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/:organizationId/members',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizationId } = context.req.valid('param');

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const { members } = await organizationsRepository.getOrganizationMembers({ organizationId });

      return context.json({ members });
    },
  );
}

function registerGetOrganizationIntakeEmailsRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/:organizationId/intake-emails',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const intakeEmailsRepository = createIntakeEmailsRepository({ db });

      const { organizationId } = context.req.valid('param');

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const { intakeEmails } = await intakeEmailsRepository.getOrganizationIntakeEmails({ organizationId });

      return context.json({ intakeEmails });
    },
  );
}

function registerGetOrganizationWebhooksRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/:organizationId/webhooks',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });

      const { organizationId } = context.req.valid('param');

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const { webhooks } = await webhookRepository.getOrganizationWebhooks({ organizationId });

      return context.json({ webhooks });
    },
  );
}

function registerGetOrganizationStatsRoute({ app, db }: RouteDefinitionContext) {
  const { requirePermissions } = createRoleMiddleware({ db });

  app.get(
    '/api/admin/organizations/:organizationId/stats',
    requireAuthentication(),
    requirePermissions({
      requiredPermissions: [PERMISSIONS.VIEW_USERS],
    }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { createDocumentsRepository } = await import('../../documents/documents.repository');
      const organizationsRepository = createOrganizationsRepository({ db });

      const { organizationId } = context.req.valid('param');

      const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

      if (!organization) {
        throw createOrganizationNotFoundError();
      }

      const documentsRepository = createDocumentsRepository({ db });
      const stats = await documentsRepository.getOrganizationStats({ organizationId });

      return context.json({ stats });
    },
  );
}
