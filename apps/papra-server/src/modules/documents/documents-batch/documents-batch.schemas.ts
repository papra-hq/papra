import * as v from 'valibot';
import { tagIdSchema } from '../../tags/tags.schemas';
import { documentIdSchema, searchDocumentsQuerySchema } from '../documents.schemas';
import { BATCH_MAX_DOCUMENTS, BATCH_MAX_TAGS_PER_REQUEST } from './documents-batch.constants';

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

const tagIdsListSchema = v.optional(
  v.pipe(v.array(tagIdSchema), v.maxLength(BATCH_MAX_TAGS_PER_REQUEST)),
  [],
);

export const batchTagsBodySchema = v.pipe(
  v.strictObject({
    filter: batchTargetFilterSchema,
    addTagIds: tagIdsListSchema,
    removeTagIds: tagIdsListSchema,
  }),
  v.check(
    ({ addTagIds, removeTagIds }) => addTagIds.length + removeTagIds.length > 0,
    'At least one of addTagIds or removeTagIds must be non-empty',
  ),
  v.check(
    ({ addTagIds, removeTagIds }) => {
      const removeSet = new Set(removeTagIds);
      return addTagIds.every(id => !removeSet.has(id));
    },
    'addTagIds and removeTagIds must be disjoint',
  ),
);

export type BatchTargetFilter = v.InferOutput<typeof batchTargetFilterSchema>;
