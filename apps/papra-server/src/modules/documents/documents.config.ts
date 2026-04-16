import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
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
    schema: v.union([
      stringCoercedOcrLanguagesSchema,
      ocrLanguagesSchema,
    ]),
    default: ['eng'],
    env: 'DOCUMENTS_OCR_LANGUAGES',
  },
  isContentExtractionEnabled: {
    doc: 'Whether to enable content extraction (OCR and text extraction) for uploaded documents',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENTS_CONTENT_EXTRACTION_ENABLED',
  },
} as const satisfies ConfigDefinition;
