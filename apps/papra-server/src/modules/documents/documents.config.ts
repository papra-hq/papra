import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { rateLimitConfigSchema } from '../app/rate-limit/rate-limit.config.schemas';
import { booleanishSchema } from '../config/config.schemas';
import { coercedNumberSchema } from '../shared/schemas/number.schemas';
import { ocrLanguagesSchema, stringCoercedOcrLanguagesSchema } from './documents.schemas';

export const documentsConfig = {
  deletedDocumentsRetentionDays: {
    doc: 'The retention period in days for deleted documents',
    schema: v.pipe(coercedNumberSchema, v.integer(), v.minValue(0)),
    default: 30,
    env: 'DOCUMENTS_DELETED_DOCUMENTS_RETENTION_DAYS',
  },
  ocrLanguages: {
    doc: 'The languages codes to use for OCR, multiple languages can be specified by separating them with a comma. See https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016',
    schema: v.union([stringCoercedOcrLanguagesSchema, ocrLanguagesSchema]),
    default: ['eng'],
    env: 'DOCUMENTS_OCR_LANGUAGES',
  },
  isReprocessingEnabled: {
    doc: 'Whether to allow reprocessing existing documents using the current instance configuration',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENT_REPROCESSING_ENABLED',
  },
  reprocessingRateLimit: {
    doc: 'The rate limit for document reprocessing requests per organization, e.g. "10/h" or "2/5m"',
    schema: rateLimitConfigSchema,
    default: '100/h',
    env: 'DOCUMENT_REPROCESSING_RATE_LIMIT',
  },
  isContentExtractionEnabled: {
    doc: 'Whether to enable content extraction (OCR and text extraction) for uploaded documents',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENTS_CONTENT_EXTRACTION_ENABLED',
  },
} as const satisfies ConfigDefinition;
