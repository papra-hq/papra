import type { RouteDefinitionContext } from '../../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../../app/auth/auth.middleware';
import { getUser } from '../../app/auth/auth.models';
import { organizationIdSchema } from '../../organizations/organization.schemas';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../../organizations/organizations.usecases';
import { createQueryPaginationSchemaKeys } from '../../shared/schemas/pagination.schemas';
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
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    validateQuery(
      v.strictObject({
        ...createQueryPaginationSchemaKeys({ maxPageSize: 100, defaultPageSize: 100 }),
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
