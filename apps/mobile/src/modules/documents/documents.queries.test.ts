import type { ApiClient } from '../api/api.client';
import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { organizationDocumentsInfiniteQueryOptions } from './documents.queries';
import { fetchOrganizationDocuments } from './documents.services';

vi.mock('./documents.services', () => ({
  fetchOrganizationDocuments: vi.fn(),
}));

const fetchDocuments = vi.mocked(fetchOrganizationDocuments);
const apiClient: ApiClient = async () => {
  throw new Error('Unexpected API request: document fetching should be mocked');
};

function createPage({ pageIndex = 0, count = 45, length = 20 } = {}) {
  return {
    documentsCount: count,
    documents: Array.from({ length }, (_, index) => ({
      id: `document-${pageIndex * 20 + index}`,
      name: 'Document',
      organizationId: 'organization-1',
      mimeType: 'application/pdf',
      originalSize: 100,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      localUri: undefined,
      tags: [],
    })),
  };
}

describe('organization documents infinite query', () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  });

  afterEach(() => {
    client.clear();
  });

  function createObserver(searchQuery?: string) {
    return new InfiniteQueryObserver(
      client,
      organizationDocumentsInfiniteQueryOptions({
        organizationId: 'organization-1',
        apiClient,
        searchQuery,
      }),
    );
  }

  test('loads successive pages and stops at the total count', async () => {
    fetchDocuments
      .mockResolvedValueOnce(createPage())
      .mockResolvedValueOnce(createPage({ pageIndex: 1 }))
      .mockResolvedValueOnce(createPage({ pageIndex: 2, length: 5 }));
    const observer = createObserver();

    await observer.refetch();
    expect(observer.getCurrentResult().hasNextPage).toBe(true);
    await observer.fetchNextPage();
    const last = await observer.fetchNextPage();

    expect(last.data?.pageParams).toEqual([0, 1, 2]);
    expect(last.data?.pages.flatMap((page) => page.documents)).toHaveLength(45);
    expect(last.hasNextPage).toBe(false);
    await observer.fetchNextPage();
    expect(fetchDocuments).toHaveBeenCalledTimes(3);
    expect(fetchDocuments.mock.calls.map(([options]) => options.pageIndex)).toEqual([0, 1, 2]);
    expect(fetchDocuments).toHaveBeenLastCalledWith({
      organizationId: 'organization-1',
      apiClient,
      searchQuery: undefined,
      pageIndex: 2,
      pageSize: 20,
    });
  });

  test.each([
    { count: 0, length: 0 },
    { count: 7, length: 7 },
    { count: 20, length: 20 },
    { count: 45, length: 0 },
  ])('stops for a terminal page: %j', async ({ count, length }) => {
    fetchDocuments.mockResolvedValueOnce(createPage({ count, length }));
    const observer = createObserver();
    await observer.refetch();
    expect(observer.getCurrentResult().hasNextPage).toBe(false);
  });

  test('preserves loaded documents on failure and retries the same page', async () => {
    fetchDocuments
      .mockResolvedValueOnce(createPage())
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(createPage({ pageIndex: 1 }));
    const observer = createObserver();
    await observer.refetch();
    const failed = await observer.fetchNextPage();
    expect(failed.isFetchNextPageError).toBe(true);
    expect(failed.data?.pages).toHaveLength(1);
    expect(failed.hasNextPage).toBe(true);

    const retried = await observer.fetchNextPage();
    expect(retried.isFetchNextPageError).toBe(false);
    expect(retried.data?.pageParams).toEqual([0, 1]);
    expect(fetchDocuments.mock.calls.map(([options]) => options.pageIndex)).toEqual([0, 1, 1]);
  });

  test('passes the search query to every page and isolates cached results', async () => {
    fetchDocuments.mockResolvedValue(createPage());
    const observer = createObserver('invoice');
    await observer.refetch();
    await observer.fetchNextPage();
    expect(fetchDocuments.mock.calls.every(([options]) => options.searchQuery === 'invoice')).toBe(
      true,
    );

    const options = organizationDocumentsInfiniteQueryOptions({
      organizationId: 'organization-1',
      apiClient,
      searchQuery: 'invoice',
    });
    expect(client.getQueryData(options.queryKey)).toBeDefined();
    for (const scope of [
      { organizationId: 'organization-2', searchQuery: 'invoice' },
      { organizationId: 'organization-1', searchQuery: 'receipt' },
      { organizationId: 'organization-1', searchQuery: undefined },
    ]) {
      const nextOptions = organizationDocumentsInfiniteQueryOptions({ ...scope, apiClient });
      expect(client.getQueryData(nextOptions.queryKey)).toBeUndefined();
    }
  });

  test('disables fetching without an organization or with an empty search', () => {
    for (const scope of [
      { organizationId: null },
      { organizationId: '' },
      { organizationId: 'organization-1', searchQuery: '' },
    ]) {
      expect(organizationDocumentsInfiniteQueryOptions({ ...scope, apiClient }).enabled).toBe(
        false,
      );
    }
  });

  test('coalesces repeated load-more requests without cancelling the pending page', async () => {
    fetchDocuments
      .mockResolvedValueOnce(createPage())
      .mockResolvedValueOnce(createPage({ pageIndex: 1 }));
    const observer = createObserver();
    await observer.refetch();

    await Promise.all([
      observer.fetchNextPage({ cancelRefetch: false }),
      observer.fetchNextPage({ cancelRefetch: false }),
    ]);

    expect(fetchDocuments).toHaveBeenCalledTimes(2);
    expect(observer.getCurrentResult().data?.pageParams).toEqual([0, 1]);
  });

  test('refreshes loaded pages from the beginning', async () => {
    fetchDocuments.mockResolvedValue(createPage());
    const observer = createObserver();
    await observer.refetch();
    await observer.fetchNextPage();
    fetchDocuments.mockClear();

    const result = await observer.refetch();
    expect(fetchDocuments.mock.calls.map(([options]) => options.pageIndex)).toEqual([0, 1]);
    expect(result.data?.pageParams).toEqual([0, 1]);
  });
});
