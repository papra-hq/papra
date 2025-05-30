import type { RouteDefinitionContext } from '../../app/server.types';
import { z } from 'zod';
import { requireAuthentication } from '../../app/auth/auth.middleware';
import { getUser } from '../../app/auth/auth.models';
import { organizationIdSchema } from '../../organizations/organization.schemas';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../../organizations/organizations.usecases';
import { validateParams, validateQuery } from '../../shared/validation/validation';
import { documentIdSchema } from '../documents.schemas';
import { createDocumentActivityRepository } from './document-activity.repository';

export function registerDocumentActivityRoutes(context: RouteDefinitionContext) {
  setupGetOrganizationDocumentActivitiesRoute(context);
}

function setupGetOrganizationDocumentActivitiesRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/activity',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    validateQuery(
      z.object({
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(100),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');
      const { pageIndex, pageSize } = context.req.valid('query');

      const organizationsRepository = createOrganizationsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { activities } = await documentActivityRepository.getOrganizationDocumentActivities({
        organizationId,
        documentId,
        pageIndex,
        pageSize,
      });

      return context.json({ activities });
    },
  );
}
