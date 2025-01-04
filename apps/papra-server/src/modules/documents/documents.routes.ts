import type { ServerInstance } from '../app/server.types';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import { getAuthUserId } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { getConfig } from '../config/config.models';
import { organizationIdRegex } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { createError } from '../shared/errors/errors';
import { validateFormData, validateParams, validateQuery } from '../shared/validation/validation';
import { createDocumentsRepository } from './documents.repository';
import { createDocument } from './documents.usecases';
import { createDocumentStorageService } from './storage/documents.storage.services';

export function registerDocumentsPrivateRoutes({ app }: { app: ServerInstance }) {
  setupCreateDocumentRoute({ app });
  setupGetDocumentsRoute({ app });
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
      const { userId } = getAuthUserId({ context });
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
      }),
    ),
    async (context) => {
      const { userId } = getAuthUserId({ context });
      const { db } = getDb({ context });

      const { organizationId } = context.req.valid('param');
      const { pageIndex, pageSize } = context.req.valid('query');

      const documentsRepository = createDocumentsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      const { isInOrganization } = await organizationsRepository.isUserInOrganization({ userId, organizationId });

      if (!isInOrganization) {
        throw createError({
          message: 'You are not part of this organization.',
          code: 'user.not_in_organization',
          statusCode: 403,
        });
      }

      const { documents } = await documentsRepository.getOrganizationDocuments({ organizationId, pageIndex, pageSize });

      return context.json({
        documents,
      });
    },
  );
}