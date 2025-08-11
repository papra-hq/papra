import type { Logger } from '../logger/logger';
import { Readable } from 'node:stream';
import createBusboy from 'busboy';
import { isDocumentSizeLimitEnabled } from '../../documents/documents.models';
import { createError } from '../errors/errors';
import { createLogger } from '../logger/logger';

export async function getFileStreamFromMultipartForm({
  body,
  headers,
  maxUploadSize,
  fieldName = 'file',
  logger = createLogger({ namespace: 'file-upload' }),
}: {
  body: ReadableStream | null | undefined;
  headers: Record<string, string>;
  maxUploadSize: number;
  fieldName?: string;
  logger?: Logger;
}) {
  if (!body) {
    throw createError({
      message: 'Missing body',
      code: 'document.no_body',
      statusCode: 400,
    });
  }

  const { promise, resolve, reject } = Promise.withResolvers<{ fileStream: ReadableStream; fileName: string; mimeType: string }>();

  createBusboy({
    headers,
    limits: {
      fileSize: isDocumentSizeLimitEnabled({ maxUploadSize }) ? maxUploadSize : undefined,
      files: 1, // Only allow one file
    },
  })
    .on('file', (formFieldname, fileStream, info) => {
      if (formFieldname !== fieldName) {
        reject(createError({
          message: 'Invalid file fieldname',
          code: 'document.invalid_file_fieldname',
          statusCode: 400,
        }));
      }

      resolve({
        fileStream: Readable.toWeb(fileStream),
        fileName: info.filename,
        mimeType: info.mimeType,
      });
    })
    .on('error', (error) => {
      logger.error({ error }, 'Busboy error');

      reject(
        createError({
          message: 'Error parsing multipart form',
          code: 'document.parse_error',
          statusCode: 400,
          cause: error,
        }),
      );
    });

  return promise;
}
