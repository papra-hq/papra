import type { ApiClient } from '../api/api.client';
import type { CoerceDates } from '../api/api.models';
import type { Document } from '../documents/documents.types';
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  documentTagMutationKey,
  documentTagMutationOptions,
  organizationTagsQueryOptions,
} from './tags.queries';

const scope = { organizationId: 'organization-1', documentId: 'document-1' };
const documentKey = ['organizations', scope.organizationId, 'documents', scope.documentId];
const tag = { id: 'tag-1', name: 'Invoice', color: '#ff0000' };
const otherTag = { id: 'tag-2', name: 'Paid', color: '#00ff00' };

function createDocument(tags: Document['tags'] = []): CoerceDates<Document> {
  return {
    id: scope.documentId,
    organizationId: scope.organizationId,
    name: 'Invoice.pdf',
    mimeType: 'application/pdf',
    originalSize: 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    localUri: undefined,
    tags,
  };
}

describe('document tag queries and mutations', () => {
  let queryClient: QueryClient;
  const apiClient = vi.fn<ApiClient>();

  beforeEach(() => {
    apiClient.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    queryClient.setQueryData(documentKey, { document: createDocument() });
  });

  afterEach(() => {
    queryClient.clear();
  });

  function createMutation() {
    return new MutationObserver(
      queryClient,
      documentTagMutationOptions({ ...scope, apiClient: apiClient as ApiClient, queryClient }),
    );
  }

  function getDocument() {
    return queryClient.getQueryData<{ document: CoerceDates<Document> }>(documentKey)?.document;
  }

  test('fetches available tags only from the document organization', async () => {
    apiClient.mockResolvedValue({ tags: [tag, otherTag] });
    const options = organizationTagsQueryOptions({
      organizationId: scope.organizationId,
      apiClient: apiClient as ApiClient,
    });
    const data = await queryClient.fetchQuery(options);

    expect(data.tags).toEqual([tag, otherTag]);
    expect(apiClient).toHaveBeenCalledExactlyOnceWith({
      method: 'GET',
      path: '/api/organizations/organization-1/tags',
    });
    expect(queryClient.getQueryData(['organizations', 'organization-2', 'tags'])).toBeUndefined();
  });

  test('selects immediately, then adds the tag through the API', async () => {
    const request = Promise.withResolvers<unknown>();
    apiClient.mockReturnValueOnce(request.promise);
    const mutation = createMutation();
    const update = mutation.mutate({ tag, selected: true });

    await vi.waitFor(() => expect(getDocument()?.tags).toEqual([tag]));
    expect(queryClient.isMutating({ mutationKey: documentTagMutationKey(scope) })).toBe(1);
    expect(mutation.getCurrentResult().isPending).toBe(true);
    expect(apiClient).toHaveBeenCalledExactlyOnceWith({
      method: 'POST',
      path: '/api/organizations/organization-1/documents/document-1/tags',
      body: { tagId: tag.id },
    });

    request.resolve(undefined);
    await update;
    expect(getDocument()?.tags).toEqual([tag]);
    expect(mutation.getCurrentResult().isSuccess).toBe(true);
    expect(queryClient.isMutating({ mutationKey: documentTagMutationKey(scope) })).toBe(0);
  });

  test('removes only the selected tag and leaves other tags assigned', async () => {
    queryClient.setQueryData(documentKey, { document: createDocument([tag, otherTag]) });
    const mutation = createMutation();
    await mutation.mutate({ tag, selected: false });

    expect(getDocument()?.tags).toEqual([otherTag]);
    expect(apiClient).toHaveBeenCalledExactlyOnceWith({
      method: 'DELETE',
      path: '/api/organizations/organization-1/documents/document-1/tags/tag-1',
    });
    // The same row can be selected again after a completed removal.
    await mutation.mutate({ tag, selected: true });
    expect(getDocument()?.tags).toEqual([otherTag, tag]);
  });

  test('does not duplicate an already assigned tag', async () => {
    queryClient.setQueryData(documentKey, { document: createDocument([tag, otherTag]) });
    await createMutation().mutate({ tag, selected: true });
    expect(getDocument()?.tags.filter(({ id }) => id === tag.id)).toHaveLength(1);
  });

  test.each([true, false])(
    'rolls back failed changes and allows retry (selected: %s)',
    async (selected) => {
      const originalTags = selected ? [otherTag] : [tag, otherTag];
      queryClient.setQueryData(documentKey, { document: createDocument(originalTags) });
      apiClient.mockRejectedValueOnce(new Error('Network unavailable'));
      const mutation = createMutation();

      await expect(mutation.mutate({ tag, selected })).rejects.toThrow('Network unavailable');
      expect(getDocument()?.tags).toEqual(originalTags);
      expect(mutation.getCurrentResult().isError).toBe(true);

      await mutation.mutate({ tag, selected });
      expect(mutation.getCurrentResult().isSuccess).toBe(true);
      expect(getDocument()?.tags).toEqual(selected ? [otherTag, tag] : [otherTag]);
    },
  );

  test('refreshes document details, lists and searches without invalidating other organizations', async () => {
    const affectedKeys = [
      documentKey,
      ['organizations', scope.organizationId, 'documents', 'infinite', { searchQuery: undefined }],
      [
        'organizations',
        scope.organizationId,
        'documents',
        'infinite',
        { searchQuery: 'tag:Invoice' },
      ],
    ];
    const unrelatedKeys = [
      ['organizations', 'organization-2', 'documents', 'document-1'],
      ['organizations', scope.organizationId, 'tags'],
      [...documentKey, 'file'],
    ];
    for (const key of [...affectedKeys.slice(1), ...unrelatedKeys]) {
      queryClient.setQueryData(key, {});
    }

    await createMutation().mutate({ tag, selected: true });
    for (const key of affectedKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    for (const key of unrelatedKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
    }
  });

  test('does not download the binary again when tagging from the document viewer', async () => {
    const fileKey = [...documentKey, 'file'];
    const downloadFile = vi.fn().mockResolvedValue({ uri: 'file:///invoice.pdf' });
    queryClient.setQueryData(fileKey, { uri: 'file:///invoice.pdf' });
    const observer = new QueryObserver(queryClient, {
      queryKey: fileKey,
      queryFn: downloadFile,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});

    await createMutation().mutate({ tag, selected: true });
    expect(downloadFile).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(fileKey)?.isInvalidated).toBe(false);
    unsubscribe();
  });

  test('waits for active document refetches before allowing another update', async () => {
    const refetch = Promise.withResolvers<{ document: CoerceDates<Document> }>();
    const observer = new QueryObserver(queryClient, {
      queryKey: documentKey,
      queryFn: async () => refetch.promise,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});
    const mutation = createMutation();
    const update = mutation.mutate({ tag, selected: true });

    await vi.waitFor(() => expect(observer.getCurrentResult().isFetching).toBe(true));
    expect(mutation.getCurrentResult().isPending).toBe(true);
    refetch.resolve({ document: createDocument([tag]) });
    await update;
    expect(mutation.getCurrentResult().isSuccess).toBe(true);
    expect(getDocument()?.tags).toEqual([tag]);
    unsubscribe();
  });

  test('cancels stale document fetches before applying the immediate selection', async () => {
    const staleFetch = Promise.withResolvers<{ document: CoerceDates<Document> }>();
    const request = Promise.withResolvers<unknown>();
    const fetchDocument = vi
      .fn()
      .mockReturnValueOnce(staleFetch.promise)
      .mockResolvedValue({ document: createDocument([tag]) });
    const observer = new QueryObserver(queryClient, {
      queryKey: documentKey,
      queryFn: fetchDocument,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});
    const refetch = observer.refetch();
    apiClient.mockReturnValueOnce(request.promise);
    const update = createMutation().mutate({ tag, selected: true });

    await vi.waitFor(() => expect(getDocument()?.tags).toEqual([tag]));
    staleFetch.resolve({ document: createDocument() });
    await refetch;
    expect(getDocument()?.tags).toEqual([tag]);

    request.resolve(undefined);
    await update;
    expect(getDocument()?.tags).toEqual([tag]);
    unsubscribe();
  });

  test('rolls back only tags without overwriting unrelated document changes', async () => {
    const request = Promise.withResolvers<unknown>();
    apiClient.mockReturnValueOnce(request.promise);
    const update = createMutation().mutate({ tag, selected: true });
    const failedUpdate = expect(update).rejects.toThrow('Update failed');

    await vi.waitFor(() => expect(getDocument()?.tags).toEqual([tag]));
    queryClient.setQueryData(documentKey, {
      document: { ...getDocument(), name: 'Renamed.pdf' },
    });
    request.reject(new Error('Update failed'));
    await failedUpdate;

    expect(getDocument()?.tags).toEqual([]);
    expect(getDocument()?.name).toBe('Renamed.pdf');
  });

  test('keeps a successful selection if the subsequent refetch fails', async () => {
    const observer = new QueryObserver(queryClient, {
      queryKey: documentKey,
      queryFn: async () => {
        throw new Error('Refetch failed');
      },
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});
    await createMutation().mutate({ tag, selected: true });
    expect(getDocument()?.tags).toEqual([tag]);
    unsubscribe();
  });
});
