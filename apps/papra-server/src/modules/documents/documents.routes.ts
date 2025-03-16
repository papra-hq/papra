import type { ServerInstance } from '../app/server.types';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { getUser } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { getConfig } from '../config/config.models';
import { organizationIdRegex } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { createError } from '../shared/errors/errors';
import { validateFormData, validateParams, validateQuery } from '../shared/validation/validation';
import { createDocumentIsNotDeletedError } from './documents.errors';
import { createDocumentsRepository } from './documents.repository';
import { createDocument, ensureDocumentExists, getDocumentOrThrow } from './documents.usecases';
import { createDocumentStorageService } from './storage/documents.storage.services';

export function registerDocumentsPrivateRoutes({ app }: { app: ServerInstance }) {
  setupCreateDocumentRoute({ app });
  setupGetDocumentsRoute({ app });
  setupSearchDocumentsRoute({ app });
  setupRestoreDocumentRoute({ app });
  setupGetDeletedDocumentsRoute({ app });
  setupGetOrganizationDocumentsStatsRoute({ app });
  setupGetDocumentRoute({ app });
  setupDeleteDocumentRoute({ app });
  setupGetDocumentFileRoute({ app });
}

function setupCreateDocumentRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations/:organizationId/documents',
    (context, next) => {
      const { config } = getConfig({ context });
      const { maxUploadSize } = config.documentsStorage;

      const middleware = bodyLimit({
        maxSize: maxUploadSize,
        onError: () => {
          throw createError({
            message: `The file is too big, the maximum size is ${maxUploadSize} bytes.`,
            code: 'document.file_too_big',
            statusCode: 413,
          });
        },
      });

      return middleware(context, next);
    },

    validateFormData(z.object({
      file: z.instanceof(File),
    })),
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { config } = getConfig({ context });

      const { file } = context.req.valid('form');
      const { organizationId } = context.req.valid('param');

      if (!file) {
        throw createError({
          message: 'No file provided, please upload a file using the "file" key.',
          code: 'document.no_file',
          statusCode: 400,
        });
      }

      if (!(file instanceof File)) {
        throw createError({
          message: 'The file provided is not a file object.',
          code: 'document.invalid_file',
          statusCode: 400,
        });
      }

      const documentsRepository = createDocumentsRepository({ db });
      const documentsStorageService = await createDocumentStorageService({ config });

      const { document } = await createDocument({
        file,
        userId,
        organizationId,
        documentsRepository,
        documentsStorageService,

      });

      return context.json({
        document,
      });
    },
  );
}

function setupGetDocumentsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
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
      const { db } = getDb({ context });

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

function setupGetDeletedDocumentsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents/deleted',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    validateQuery(
      z.object({
        pageIndex: z.coerce.number().min(0).int().optional().default(0),
        pageSize: z.coerce.number().min(1).max(100).int().optional().default(100),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });

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

function setupGetDocumentRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });

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

function setupDeleteDocumentRoute({ app }: { app: ServerInstance }) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });
      await ensureDocumentExists({ documentId, organizationId, documentsRepository });

      await documentsRepository.softDeleteDocument({ documentId, organizationId, userId });

      return context.json({
        success: true,
      });
    },
  );
}

function setupRestoreDocumentRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/restore',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

      if (!document.isDeleted) {
        throw createDocumentIsNotDeletedError();
      }

      await documentsRepository.restoreDocument({ documentId, organizationId });

      return context.body(null, 204);
    },
  );
}

function setupGetDocumentFileRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/file',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
      const { config } = getConfig({ context });

      const { organizationId, documentId } = context.req.valid('param');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { document } = await getDocumentOrThrow({ documentId, documentsRepository, organizationId });

      const documentsStorageService = await createDocumentStorageService({ config });

      const { fileStream } = await documentsStorageService.getFileStream({ storageKey: document.originalStorageKey });

      return context.body(
        fileStream,
        200,
        {
          'Content-Type': document.mimeType,
          'Content-Disposition': `inline; filename="${document.name}"`,
          'Content-Length': String(document.originalSize),
        },
      );
    },
  );
}

function setupSearchDocumentsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents/search',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
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
      const { db } = getDb({ context });

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

function setupGetOrganizationDocumentsStatsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/documents/statistics',
    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),
    async (context) => {
      const { userId } = getUser({ context });
      const { db } = getDb({ context });
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
