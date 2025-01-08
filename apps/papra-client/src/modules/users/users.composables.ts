import { queryClient } from '@/modules/shared/query/query-client';
import { updateUser } from './users.services';

export function useUpdateCurrentUser() {
  return {
    updateCurrentUser: async ({ fullName }: { fullName: string }) => {
      await updateUser({ fullName });

      await queryClient.invalidateQueries({
        queryKey: ['users'],
        refetchType: 'all',
      });
    },
  };
}
