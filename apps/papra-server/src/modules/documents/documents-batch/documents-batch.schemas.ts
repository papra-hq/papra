import * as v from 'valibot';
import { documentIdSchema, searchDocumentsQuerySchema } from '../documents.schemas';
import { BATCH_MAX_DOCUMENTS } from './documents-batch.constants';

export const batchTargetFilterSchema = v.union([
  v.strictObject({
    documentIds: v.pipe(
      v.array(documentIdSchema),
      v.minLength(1),
      v.maxLength(BATCH_MAX_DOCUMENTS),
    ),
  }),
  v.strictObject({
    query: searchDocumentsQuerySchema,
  }),
]);

export const batchTrashBodySchema = v.strictObject({
  filter: batchTargetFilterSchema,
});

export type BatchTargetFilter = v.InferOutput<typeof batchTargetFilterSchema>;
