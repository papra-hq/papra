import type { RouteDefinitionContext } from '../app/server.types';
import { Readable } from 'node:stream';
import { z } from 'zod';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createPlansRepository } from '../plans/plans.repository';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { getFileStreamFromMultipartForm } from '../shared/streams/file-upload';
import { validateJsonBody, validateParams, validateQuery } from '../shared/validation/validation';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { searchOrganizationDocuments } from './document-search/document-search.usecase';
import { createDocumentIsNotDeletedError } from './documents.errors';
import { formatDocumentForApi, formatDocumentsForApi, isDocumentSizeLimitEnabled } from './documents.models';
import { createDocumentsRepository } from './documents.repository';
import { documentIdSchema } from './documents.schemas';
import { createDocumentCreationUsecase, deleteAllTrashDocuments, deleteTrashDocument, ensureDocumentExists, getDocumentOrThrow, restoreDocument, trashDocument, updateDocument } from './documents.usecases';

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
  setupGetDocumentPreviewRoute(context);
  setupUpdateDocumentRoute(context);
}

function setupCreateDocumentRoute({ app, ...deps }: RouteDefinitionContext) {
  const { config, db } = deps;

  app.post(
    '/api/organizations/:organizationId/documents',
    requireAuthentication({ apiKeyPermissions: ['documents:create'] }),
    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      // Get organization's plan-specific upload limit
      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      const { organizationPlan } = await getOrganizationPlan({ organizationId, plansRepository, subscriptionsRepository });
      const { maxFileSize } = organizationPlan.limits;

      const { fileStream, fileName, mimeType } = await getFileStreamFromMultipartForm({
        body: context.req.raw.body,
        headers: context.req.header(),
        maxFileSize: isDocumentSizeLimitEnabled({ maxUploadSize: maxFileSize }) ? maxFileSize : undefined,
      });

      const createDocument = createDocumentCreationUsecase({ ...deps });

      const { document } = await createDocument({ fileStream, fileName, mimeType, userId, organizationId });

      return context.json({ document: formatDocumentForApi({ document }) });
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
        documentsRepository.getOrganizationDocuments({ organizationId, pageIndex, pageSize }),
        documentsRepository.getOrganizationDocumentsCount({ organizationId }),
      ]);

      return context.json({
        documents: formatDocumentsForApi({ documents }),
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
        documents: formatDocumentsForApi({ documents }),
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
        document: formatDocumentForApi({ document }),
      });
    },
  );
}

function setupDeleteDocumentRoute({ app, db, eventServices }: RouteDefinitionContext) {
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

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });
      await ensureDocumentExists({ documentId, organizationId, documentsRepository });

      await trashDocument({
        documentId,
        organizationId,
        userId,
        documentsRepository,
        eventServices,
      });

      return context.json({
        success: true,
      });
    },
  );
}

function setupRestoreDocumentRoute({ app, db, eventServices }: RouteDefinitionContext) {
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

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

      if (!document.isDeleted) {
        throw createDocumentIsNotDeletedError();
      }

      await restoreDocument({
        documentId,
        organizationId,
        userId,
        documentsRepository,
        eventServices,
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

      const { fileStream } = await documentsStorageService.getFileStream({
        storageKey: document.originalStorageKey,
        fileEncryptionAlgorithm: document.fileEncryptionAlgorithm,
        fileEncryptionKekVersion: document.fileEncryptionKekVersion,
        fileEncryptionKeyWrapped: document.fileEncryptionKeyWrapped,
      });

      return context.body(
        Readable.toWeb(fileStream),
        200,
        {
          // Prevent XSS by serving the file as an octet-stream
          'Content-Type': 'application/octet-stream',
          // Always use attachment for defense in depth - client uses blob API anyway
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
          'Content-Length': String(document.originalSize),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      );
    },
  );
}

function setupGetDocumentPreviewRoute({ app, db, documentsStorageService }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/preview',
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

      // Import the conversion service dynamically to avoid startup errors if LibreOffice is not installed
      const { documentConversionService } = await import('./document-conversion.service');

      // Check if document needs conversion
      const needsConversion = documentConversionService.isSupportedMimeType(document.mimeType);

      if (!needsConversion) {
        // If no conversion needed, return the original file
        const { fileStream } = await documentsStorageService.getFileStream({
          storageKey: document.originalStorageKey,
          fileEncryptionAlgorithm: document.fileEncryptionAlgorithm,
          fileEncryptionKekVersion: document.fileEncryptionKekVersion,
          fileEncryptionKeyWrapped: document.fileEncryptionKeyWrapped,
        });

        return context.body(
          Readable.toWeb(fileStream),
          200,
          {
            'Content-Type': document.mimeType,
            'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.name)}`,
            'Content-Length': String(document.originalSize),
            'X-Content-Type-Options': 'nosniff',
          },
        );
      }

      // Check if we have a cached preview
      if (document.previewStorageKey) {
        const { fileStream } = await documentsStorageService.getFileStream({
          storageKey: document.previewStorageKey,
          fileEncryptionAlgorithm: null,
          fileEncryptionKekVersion: null,
          fileEncryptionKeyWrapped: null,
        });

        return context.body(
          Readable.toWeb(fileStream),
          200,
          {
            'Content-Type': document.previewMimeType || 'application/pdf',
            'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.name.replace(/\.[^.]+$/, '.pdf'))}`,
            'Content-Length': String(document.previewSize || 0),
            'X-Content-Type-Options': 'nosniff',
          },
        );
      }

      // Convert document to PDF
      const { fileStream: originalStream } = await documentsStorageService.getFileStream({
        storageKey: document.originalStorageKey,
        fileEncryptionAlgorithm: document.fileEncryptionAlgorithm,
        fileEncryptionKekVersion: document.fileEncryptionKekVersion,
        fileEncryptionKeyWrapped: document.fileEncryptionKeyWrapped,
      });

      // Read stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of originalStream) {
        chunks.push(Buffer.from(chunk));
      }
      const originalBuffer = Buffer.concat(chunks);

      // Convert to PDF
      const { buffer: pdfBuffer, mimeType: pdfMimeType } = await documentConversionService.convertToPdf(
        originalBuffer,
        document.mimeType,
        {
          documentId: document.id,
          name: document.name,
          mimeType: document.mimeType,
        },
      );

      // Store preview in storage (without encryption for now)
      const previewStorageKey = `${document.originalStorageKey}.preview.pdf`;
      const previewStream = Readable.from(pdfBuffer);

      await documentsStorageService.saveFile({
        fileStream: previewStream,
        fileName: `${document.name}.preview.pdf`,
        mimeType: pdfMimeType,
        storageKey: previewStorageKey,
      });

      // Update document with preview info
      await documentsRepository.updatePreviewFields({
        id: documentId,
        previewStorageKey,
        previewMimeType: pdfMimeType,
        previewSize: pdfBuffer.length,
        previewGeneratedAt: new Date(),
      });

      // Return the converted PDF
      return context.body(
        Readable.from(pdfBuffer),
        200,
        {
          'Content-Type': pdfMimeType,
          'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(document.name.replace(/\.[^.]+$/, '.pdf'))}`,
          'Content-Length': String(pdfBuffer.length),
          'X-Content-Type-Options': 'nosniff',
        },
      );
    },
  );
}

function setupSearchDocumentsRoute({ app, db, documentSearchServices }: RouteDefinitionContext) {
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

      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { documents, totalCount } = await searchOrganizationDocuments({
        organizationId,
        searchQuery,
        pageIndex,
        pageSize,
        documentSearchServices,
      });

      return context.json({
        documents,
        totalCount,
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

      const {
        documentsCount,
        documentsSize,
        deletedDocumentsCount,
        deletedDocumentsSize,
        totalDocumentsCount,
        totalDocumentsSize,
      } = await documentsRepository.getOrganizationStats({ organizationId });

      return context.json({
        organizationStats: {
          documentsCount,
          documentsSize,
          deletedDocumentsCount,
          deletedDocumentsSize,
          totalDocumentsCount,
          totalDocumentsSize,
        },
      });
    },
  );
}

function setupDeleteTrashDocumentRoute({ app, db, documentsStorageService, eventServices }: RouteDefinitionContext) {
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

      await deleteTrashDocument({ documentId, organizationId, documentsRepository, documentsStorageService, eventServices });

      return context.json({
        success: true,
      });
    },
  );
}

function setupDeleteAllTrashDocumentsRoute({ app, db, documentsStorageService, eventServices }: RouteDefinitionContext) {
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

      await deleteAllTrashDocuments({ organizationId, documentsRepository, documentsStorageService, eventServices });

      return context.body(null, 204);
    },
  );
}

function setupUpdateDocumentRoute({ app, db, eventServices }: RouteDefinitionContext) {
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
      const changes = context.req.valid('json');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });
      await ensureDocumentExists({ documentId, organizationId, documentsRepository });

      const { document } = await updateDocument({
        documentId,
        organizationId,
        userId,
        documentsRepository,
        eventServices,
        changes,
      });

      return context.json({ document: formatDocumentForApi({ document }) });
    },
  );
}
