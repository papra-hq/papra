import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { DOCUMENT_ID_REGEX } from './documents.constants';

export const documentIdSchema = createRegexSchema(DOCUMENT_ID_REGEX);

export const updateDocumentBodySchema = v.pipe(
  v.strictObject({
    name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(255))),
    content: v.optional(v.string()),
    documentDate: v.optional(v.nullable(v.pipe(v.string(), v.toDate()))),
  }),
  v.check(
    data => data.name !== undefined || data.content !== undefined || data.documentDate !== undefined,
    'At least one of \'name\', \'content\', or \'documentDate\' must be provided',
  ),
);
