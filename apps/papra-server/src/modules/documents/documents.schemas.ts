import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import {
  documentSearchSortFields,
  documentSearchSortOrders,
} from './document-search/document-search.constants';
import { DOCUMENT_ID_REGEX, OCR_LANGUAGES } from './documents.constants';

export const documentIdSchema = createRegexSchema(DOCUMENT_ID_REGEX);

export const updateDocumentBodySchema = v.pipe(
  v.strictObject({
    name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(255))),
    content: v.optional(v.string()),
    documentDate: v.optional(v.nullable(v.pipe(v.string(), v.toDate()))),
    notes: v.optional(v.pipe(v.string(), v.maxLength(2048))),
  }),
  v.check(
    (data) =>
      data.name !== undefined ||
      data.content !== undefined ||
      data.documentDate !== undefined ||
      data.notes !== undefined,
    "At least one of 'name', 'content', 'documentDate' or 'notes' must be provided",
  ),
);

export const ocrLanguagesSchema = v.array(v.picklist(OCR_LANGUAGES));
export const stringCoercedOcrLanguagesSchema = v.pipe(
  v.string(),
  v.transform((value) => value.split(',').map((lang) => lang.trim())),
  ocrLanguagesSchema,
);

export const searchDocumentsQuerySchema = v.pipe(v.string(), v.maxLength(1024));

export const documentSearchSortFieldSchema = v.picklist(documentSearchSortFields);
export const documentSearchSortOrderSchema = v.picklist(documentSearchSortOrders);
