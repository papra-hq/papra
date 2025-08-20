import type { Logger } from '../logger/logger';
import { Readable } from 'node:stream';
import createBusboy from 'busboy';
import { createError } from '../errors/errors';
import { createLogger } from '../logger/logger';

export async function getFileStreamFromMultipartForm({
  body,
  headers,
  fieldName = 'file',
  logger = createLogger({ namespace: 'file-upload' }),
}: {
  body: ReadableStream | null | undefined;
  headers: Record<string, string>;
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

  const { promise, resolve, reject } = Promise.withResolvers<{ fileStream: Readable; fileName: string; mimeType: string }>();

  const bb = createBusboy({
    headers,
    limits: {
      files: 1, // Only allow one file
    },
  })
    .on('file', (formFieldname, fileStream, info) => {
      if (formFieldname !== fieldName) {
        if (!bb.destroyed) {
          bb.destroy();
        }

        reject(createError({
          message: 'Invalid file fieldname',
          code: 'document.invalid_file_fieldname',
          statusCode: 400,
        }));
      }

      resolve({
        fileStream,
        fileName: info.filename,
        mimeType: info.mimeType,
      });
    })
    .on('error', (error) => {
      logger.error({ error }, 'Busboy error');

      if (!bb.destroyed) {
        bb.destroy();
      }

      reject(
        createError({
          message: 'Error parsing multipart form',
          code: 'document.parse_error',
          statusCode: 400,
          cause: error,
        }),
      );
    });

  Readable.fromWeb(body).pipe(bb);

  return promise;
}
