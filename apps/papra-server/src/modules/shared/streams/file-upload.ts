import type { Logger } from '../logger/logger';
import { Readable } from 'node:stream';
import createBusboy from 'busboy';
import { MULTIPART_FORM_DATA_SINGLE_FILE_CONTENT_LENGTH_OVERHEAD } from '../../documents/documents.constants';
import { createDocumentSizeTooLargeError } from '../../documents/documents.errors';
import { createError } from '../errors/errors';
import { getContentLengthHeader } from '../headers/headers.models';
import { createLogger } from '../logger/logger';
import { isNil } from '../utils';

// Early check to avoid parsing the stream if the content length is set and too large
export function isContentLengthPessimisticallyTooLarge({
  contentLength,
  maxFileSize,
  overhead = MULTIPART_FORM_DATA_SINGLE_FILE_CONTENT_LENGTH_OVERHEAD,
}: {
  contentLength?: number;
  maxFileSize?: number;
  overhead?: number;
}) {
  if (isNil(contentLength) || isNil(maxFileSize)) {
    return false;
  }

  return contentLength > maxFileSize + overhead;
}

export async function getFileStreamFromMultipartForm({
  body,
  headers,
  fieldName = 'file',
  maxFileSize,
  logger = createLogger({ namespace: 'file-upload' }),
}: {
  body: ReadableStream | null | undefined;
  headers: Record<string, string>;
  fieldName?: string;
  maxFileSize?: number;
  logger?: Logger;
}) {
  if (!body) {
    throw createError({
      message: 'Missing body',
      code: 'document.no_body',
      statusCode: 400,
    });
  }

  const contentLength = getContentLengthHeader({ headers });
  if (isContentLengthPessimisticallyTooLarge({ contentLength, maxFileSize })) {
    logger.debug({ contentLength, maxFileSize }, 'Content length is pessimistically too large');

    throw createDocumentSizeTooLargeError();
  }

  const { promise, resolve, reject } = Promise.withResolvers<{ fileStream: Readable; fileName: string; mimeType: string }>();

  const bb = createBusboy({
    headers,
    limits: {
      files: 1, // Only allow one file
      fileSize: maxFileSize,
    },
    defParamCharset: 'utf8',
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

      fileStream.on('limit', () => {
        logger.info({ contentLength, maxFileSize }, 'File stream limit reached');
        fileStream.destroy(createDocumentSizeTooLargeError());
      });

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
