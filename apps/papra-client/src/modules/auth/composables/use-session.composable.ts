import { useQuery } from '@tanstack/solid-query';
import { getSession } from '../auth.services';

export function useSession() {
  const sessionQuery = useQuery(() => ({
    queryKey: ['auth', 'session'],
    queryFn: () => getSession(),
  }));

  const getUser = () => sessionQuery.data?.data?.user;
  const getIsAuthenticated = () => Boolean(getUser());

  return {
    sessionQuery,
    getUser,
    getIsAuthenticated,
  };
}
