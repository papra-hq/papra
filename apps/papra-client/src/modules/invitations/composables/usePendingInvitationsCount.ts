import { useQuery } from '@tanstack/solid-query';
import { fetchPendingInvitationsCount } from '../invitations.services';

export function usePendingInvitationsCount() {
  const query = useQuery(() => ({
    queryKey: ['invitations', 'count'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: fetchPendingInvitationsCount,
  }));

  return {
    ...query,
    getPendingInvitationsCount: () => query.data?.pendingInvitationsCount ?? 0,
  };
}
