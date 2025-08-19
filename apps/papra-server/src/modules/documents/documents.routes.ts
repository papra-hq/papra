import type { RouteDefinitionContext } from '../app/server.types';
import { Readable } from 'node:stream';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { getFileStreamFromMultipartForm } from '../shared/streams/file-upload';
import { validateJsonBody, validateParams, validateQuery } from '../shared/validation/validation';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { deferTriggerWebhooks } from '../webhooks/webhook.usecases';
import { createDocumentActivityRepository } from './document-activity/document-activity.repository';
import { deferRegisterDocumentActivityLog } from './document-activity/document-activity.usecases';
import { createDocumentIsNotDeletedError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';
import { documentIdSchema } from './documents.schemas';
import { createDocumentCreationUsecase, deleteAllTrashDocuments, deleteTrashDocument, ensureDocumentExists, getDocumentOrThrow } from './documents.usecases';

export function registerDocumentsRoutes(context: RouteDefinitionContext) {
  setupCreateDocumentRoute(context);
  setupGetDocumentsRoute(context);
  setupSearchDocumentsRoute(context);
  setupRestoreDocumentRoute(context);
  setupGetDeletedDocumentsRoute(context);
  setupGetOrganizationDocumentsStatsRoute(context);
  setupGetDocumentRoute(context);
  setupDeleteTrashDocumentRoute(context);
  setupDeleteAllTrashDocumentsRoute(context);
  setupDeleteDocumentRoute(context);
  setupGetDocumentFileRoute(context);
  setupUpdateDocumentRoute(context);
}

function setupCreateDocumentRoute({ app, ...deps }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents',
    requireAuthentication({ apiKeyPermissions: ['documents:create'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const { fileStream, fileName, mimeType } = await getFileStreamFromMultipartForm({
        body: context.req.raw.body,
        headers: context.req.header(),
      });

      const createDocument = await createDocumentCreationUsecase({ ...deps });

      const { document } = await createDocument({ fileStream, fileName, mimeType, userId, organizationId });

      return context.json({ document });
    },
  );
}

function setupGetDocumentsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateQuery(
      z.object({
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(100),
        tags: z.union([
          z.array(z.string()),
          z.string().transform(value => [value]),
        ]).optional(),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { pageIndex, pageSize, tags } = context.req.valid('query');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const [
        { documents },
        { documentsCount },
      ] = await Promise.all([
        documentsRepository.getOrganizationDocuments({ organizationId, pageIndex, pageSize, filters: { tags } }),
        documentsRepository.getOrganizationDocumentsCount({ organizationId, filters: { tags } }),
      ]);

      return context.json({
        documents,
        documentsCount,
      });
    },
  );
}

function setupGetDeletedDocumentsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/deleted',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateQuery(
      z.object({
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(100),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { pageIndex, pageSize } = context.req.valid('query');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const [
        { documents },
        { documentsCount },
      ] = await Promise.all([
        documentsRepository.getOrganizationDeletedDocuments({ organizationId, pageIndex, pageSize }),
        documentsRepository.getOrganizationDeletedDocumentsCount({ organizationId }),
      ]);

      return context.json({
        documents,
        documentsCount,
      });
    },
  );
}

function setupGetDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

      return context.json({
        document,
      });
    },
  );
}

function setupDeleteDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId',
    requireAuthentication({ apiKeyPermissions: ['documents:delete'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });
      await ensureDocumentExists({ documentId, organizationId, documentsRepository });

      await documentsRepository.softDeleteDocument({ documentId, organizationId, userId });

      deferTriggerWebhooks({
        webhookRepository,
        organizationId,
        event: 'document:deleted',
        payload: { documentId, organizationId },
      });

      deferRegisterDocumentActivityLog({
        documentId,
        event: 'deleted',
        userId,
        documentActivityRepository,
      });

      return context.json({
        success: true,
      });
    },
  );
}

function setupRestoreDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/restore',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

      if (!document.isDeleted) {
        throw createDocumentIsNotDeletedError();
      }

      await documentsRepository.restoreDocument({ documentId, organizationId });

      deferRegisterDocumentActivityLog({
        documentId,
        event: 'restored',
        userId,
        documentActivityRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupGetDocumentFileRoute({ app, db, documentsStorageService }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/file',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, documentsRepository, organizationId });

      const { fileStream } = await documentsStorageService.getFileStream({ storageKey: document.originalStorageKey });

      return context.body(
        Readable.toWeb(fileStream),
        200,
        {
          'Content-Type': document.mimeType,
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.name)}`,
          'Content-Length': String(document.originalSize),
        },
      );
    },
  );
}

function setupSearchDocumentsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/search',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    validateQuery(
      z.object({
        searchQuery: z.string(),
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(100),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { searchQuery, pageIndex, pageSize } = context.req.valid('query');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documents } = await documentsRepository.searchOrganizationDocuments({ organizationId, searchQuery, pageIndex, pageSize });

      return context.json({
        documents,
      });
    },
  );
}

function setupGetOrganizationDocumentsStatsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/statistics',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documentsCount, documentsSize } = await documentsRepository.getOrganizationStats({ organizationId });

      return context.json({
        organizationStats: {
          documentsCount,
          documentsSize,
        },
      });
    },
  );
}

function setupDeleteTrashDocumentRoute({ app, db, documentsStorageService }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/trash/:documentId',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await deleteTrashDocument({ documentId, organizationId, documentsRepository, documentsStorageService });

      return context.json({
        success: true,
      });
    },
  );
}

function setupDeleteAllTrashDocumentsRoute({ app, db, documentsStorageService }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/trash',
    requireAuthentication(),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await deleteAllTrashDocuments({ organizationId, documentsRepository, documentsStorageService });

      return context.body(null, 204);
    },
  );
}

function setupUpdateDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/documents/:documentId',
    requireAuthentication({ apiKeyPermissions: ['documents:update'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    validateJsonBody(z.object({
      name: z.string().min(1).max(255).optional(),
      content: z.string().optional(),
    }).refine(data => data.name !== undefined || data.content !== undefined, {
      message: 'At least one of \'name\' or \'content\' must be provided',
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId } = context.req.valid('param');
      const updateData = context.req.valid('json');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });
      const webhookRepository = createWebhookRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });
      await ensureDocumentExists({ documentId, organizationId, documentsRepository });

      const { document } = await documentsRepository.updateDocument({
        documentId,
        organizationId,
        ...updateData,
      });

      deferTriggerWebhooks({
        webhookRepository,
        organizationId,
        event: 'document:updated',
        payload: { documentId, organizationId, ...updateData },
      });

      deferRegisterDocumentActivityLog({
        documentId,
        event: 'updated',
        userId,
        documentActivityRepository,
        eventData: {
          updatedFields: Object.entries(updateData).filter(([_, value]) => value !== undefined).map(([key]) => key),
        },
      });

      return context.json({ document });
    },
  );
}
