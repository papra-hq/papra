import type { RouteDefinitionContext } from '../../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../../app/auth/auth.middleware';
import { getUser } from '../../app/auth/auth.models';
import { organizationIdSchema } from '../../organizations/organization.schemas';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../../shared/validation/validation';
import { createDocumentsRepository } from '../documents.repository';
import { batchTrashBodySchema } from './documents-batch.schemas';
import { trashDocumentsBatch } from './documents-batch.usecases';

export function registerDocumentsBatchRoutes(context: RouteDefinitionContext) {
  setupBatchTrashDocumentsRoute(context);
}

function setupBatchTrashDocumentsRoute({ app, db, eventServices, documentSearchServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/batch/trash',
    requireAuthentication({ apiKeyPermissions: ['documents:delete'] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(batchTrashBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { filter } = context.req.valid('json');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await trashDocumentsBatch({
        filter,
        organizationId,
        userId,
        documentsRepository,
        documentSearchServices,
        eventServices,
      });

      return context.body(null, 204);
    },
  );
}
