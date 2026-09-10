import type { ApiClient } from '../api/api.client';
import { infiniteQueryOptions } from '@tanstack/react-query';
import { fetchOrganizationDocuments } from './documents.services';

const pageSize = 20;

export function organizationDocumentsInfiniteQueryOptions({
  organizationId,
  apiClient,
  searchQuery,
}: {
  organizationId: string | null;
  apiClient: ApiClient;
  searchQuery?: string;
}) {
  return infiniteQueryOptions({
    queryKey: ['organizations', organizationId, 'documents', 'infinite', { searchQuery, pageSize }],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) {
        return { documents: [], documentsCount: 0 };
      }

      return fetchOrganizationDocuments({
        organizationId,
        apiClient,
        searchQuery,
        pageIndex: pageParam,
        pageSize,
      });
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const nextPageIndex = lastPageParam + 1;

      // An empty page also ends pagination if the count changed while browsing.
      if (lastPage.documents.length === 0 || nextPageIndex * pageSize >= lastPage.documentsCount) {
        return undefined;
      }

      return nextPageIndex;
    },
    enabled: Boolean(organizationId) && (searchQuery === undefined || searchQuery !== ''),
  });
}
