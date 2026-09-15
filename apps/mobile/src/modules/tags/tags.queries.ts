import type { QueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../api/api.client';
import type { fetchDocument } from '../documents/documents.services';
import type { Tag } from './tags.types';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { addTagToDocument, fetchTags, removeTagFromDocument } from './tags.services';

type DocumentData = Awaited<ReturnType<typeof fetchDocument>>;
type DocumentScope = { organizationId: string; documentId: string };

export function documentTagMutationKey({ organizationId, documentId }: DocumentScope) {
  return ['organizations', organizationId, 'documents', documentId, 'tags'];
}

export function organizationTagsQueryOptions({
  organizationId,
  apiClient,
}: {
  organizationId: string;
  apiClient: ApiClient;
}) {
  return queryOptions({
    queryKey: ['organizations', organizationId, 'tags'],
    queryFn: async () => fetchTags({ organizationId, apiClient }),
    staleTime: 0,
  });
}

export function documentTagMutationOptions({
  organizationId,
  documentId,
  apiClient,
  queryClient,
}: DocumentScope & { apiClient: ApiClient; queryClient: QueryClient }) {
  const queryKey = ['organizations', organizationId, 'documents', documentId];

  return mutationOptions({
    mutationKey: documentTagMutationKey({ organizationId, documentId }),
    mutationFn: async ({ tag, selected }: { tag: Tag; selected: boolean }) => {
      const updateTag = selected ? addTagToDocument : removeTagFromDocument;
      await updateTag({ organizationId, documentId, tagId: tag.id, apiClient });
    },
    onMutate: async ({ tag, selected }) => {
      // Prevent a background refetch from overwriting the immediate selection.
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previousTags = queryClient.getQueryData<DocumentData>(queryKey)?.document.tags;

      queryClient.setQueryData<DocumentData>(queryKey, (data) => {
        if (!data) {
          return data;
        }

        const tags = data.document.tags.filter(({ id }) => id !== tag.id);
        return {
          ...data,
          document: { ...data.document, tags: selected ? [...tags, tag] : tags },
        };
      });

      return { previousTags };
    },
    onError: (_error, _variables, context) => {
      const previousTags = context?.previousTags;
      if (previousTags) {
        queryClient.setQueryData<DocumentData>(queryKey, (data) =>
          data ? { ...data, document: { ...data.document, tags: previousTags } } : data,
        );
      }
    },
    // Refresh details, lists and tag-filtered searches, even if the drawer unmounts.
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizations', organizationId, 'documents'],
        // Tag changes do not affect the binary cached by the document viewer.
        predicate: (query) => query.queryKey[4] !== 'file',
      });
    },
  });
}
