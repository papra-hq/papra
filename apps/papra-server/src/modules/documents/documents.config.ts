import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { ocrLanguagesSchema, stringCoercedOcrLanguagesSchema } from './documents.schemas';

export const documentsConfig = {
  deletedDocumentsRetentionDays: {
    doc: 'The retention period in days for deleted documents',
    schema: z.coerce.number().int().positive(),
    default: 30,
    env: 'DOCUMENTS_DELETED_DOCUMENTS_RETENTION_DAYS',
  },
  ocrLanguages: {
    doc: 'The languages codes to use for OCR, multiple languages can be specified by separating them with a comma. See https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016',
    schema: z.union([
      stringCoercedOcrLanguagesSchema,
      ocrLanguagesSchema,
    ]),
    default: ['eng'],
    env: 'DOCUMENTS_OCR_LANGUAGES',
  },
} as const satisfies ConfigDefinition;
