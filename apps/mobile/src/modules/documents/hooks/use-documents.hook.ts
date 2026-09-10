import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { organizationDocumentsInfiniteQueryOptions } from '../documents.queries';

export function useDocuments({ searchQuery }: { searchQuery?: string } = {}) {
  const apiClient = useApiClient();
  const { currentOrganizationId } = useOrganizations();
  const query = useInfiniteQuery(
    organizationDocumentsInfiniteQueryOptions({
      organizationId: currentOrganizationId,
      apiClient,
      searchQuery,
    }),
  );

  const documents = useMemo(() => {
    // Offset pagination can overlap when documents are added while browsing.
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.documents) ?? []).filter((document) => {
      if (seen.has(document.id)) {
        return false;
      }
      seen.add(document.id);
      return true;
    });
  }, [query.data]);

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetching) {
      // Repeated end-of-list events must not cancel an in-flight request.
      void query.fetchNextPage({ cancelRefetch: false });
    }
  };

  return { ...query, documents, loadMore };
}
