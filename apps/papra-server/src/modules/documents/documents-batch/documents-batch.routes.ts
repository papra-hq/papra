import type { RouteDefinitionContext } from '../../app/server.types';
import * as v from 'valibot';
import { API_KEY_PERMISSIONS } from '../../api-keys/api-keys.constants';
import { requireAuthentication } from '../../app/auth/auth.middleware';
import { getUser } from '../../app/auth/auth.models';
import { organizationIdSchema } from '../../organizations/organization.schemas';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../../shared/validation/validation';
import { createTagsRepository } from '../../tags/tags.repository';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { createDocumentsRepository } from '../documents.repository';
import { batchTagsBodySchema, batchTrashBodySchema } from './documents-batch.schemas';
import { tagDocumentsBatch, trashDocumentsBatch } from './documents-batch.usecases';

export function registerDocumentsBatchRoutes(context: RouteDefinitionContext) {
  setupBatchTrashDocumentsRoute(context);
  setupBatchTagDocumentsRoute(context);
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

function setupBatchTagDocumentsRoute({ app, db, documentSearchServices, webhookTriggerServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/batch/tags',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.UPDATE, API_KEY_PERMISSIONS.TAGS.READ] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(batchTagsBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { filter, addTagIds, removeTagIds } = context.req.valid('json');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagDocumentsBatch({
        filter,
        addTagIds,
        removeTagIds,
        organizationId,
        userId,
        documentsRepository,
        tagsRepository,
        documentSearchServices,
        webhookTriggerServices,
        documentActivityRepository,
      });

      return context.body(null, 204);
    },
  );
}
