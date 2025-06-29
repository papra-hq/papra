import type { RouteDefinitionContext } from '../app/server.types';
import type { DocumentsRequestAccessLevel } from './documents-requests.types';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { tagIdSchema } from '../tags/tags.schemas';
import { createDocumentsRequestsRepository } from './documents-requests.repository';
import { createDocumentsRequest } from './documents-requests.usecases';

export function registerDocumentsRequestsRoutes(context: RouteDefinitionContext) {
  setupCreateDocumentsRequestRoute(context);
}

function setupCreateDocumentsRequestRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents-requests',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(512).optional(),
      useLimit: z.number().positive().optional(),
      expiresAt: z.date().optional(),
      accessLevel: z.enum(['organization_members', 'authenticated_users', 'public'] as const),
      isEnabled: z.boolean().optional().default(true),
      files: z.array(z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(512).optional(),
        allowedMimeTypes: z.array(z.string()).optional().default(['*/*']),
        sizeLimit: z.number().positive().optional(),
        tags: z.array(tagIdSchema).optional().default([]),
      })).min(1).max(32),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { title, description, useLimit, expiresAt, accessLevel, isEnabled, files } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRequestsRepository = createDocumentsRequestsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentsRequest } = await createDocumentsRequest({
        organizationId,
        createdBy: userId,
        title,
        description,
        useLimit,
        expiresAt,
        accessLevel: accessLevel as DocumentsRequestAccessLevel,
        isEnabled,
        documentsRequestsRepository,
        files,
      });

      return context.json({
        documentsRequest,
      });
    },
  );
}
