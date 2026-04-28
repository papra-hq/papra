import * as v from 'valibot';
import { documentIdSchema } from '../documents.schemas';
import { BATCH_MAX_DOCUMENTS, BATCH_MAX_QUERY_LENGTH } from './documents-batch.constants';

export const batchTargetFilterSchema = v.union([
  v.strictObject({
    documentIds: v.pipe(
      v.array(documentIdSchema),
      v.minLength(1),
      v.maxLength(BATCH_MAX_DOCUMENTS),
    ),
  }),
  v.strictObject({
    query: v.pipe(v.string(), v.minLength(1), v.maxLength(BATCH_MAX_QUERY_LENGTH)),
  }),
]);

export const batchTrashBodySchema = v.strictObject({
  filter: batchTargetFilterSchema,
});

export type BatchTargetFilter = v.InferOutput<typeof batchTargetFilterSchema>;
