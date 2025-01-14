import { queryClient } from '@/modules/shared/query/query-client';
import { updateUser } from './users.services';

export function useUpdateCurrentUser() {
  return {
    updateCurrentUser: async ({ name }: { name: string }) => {
      await updateUser({ name });

      await queryClient.invalidateQueries({
        queryKey: ['users'],
        refetchType: 'all',
      });
    },
  };
}
