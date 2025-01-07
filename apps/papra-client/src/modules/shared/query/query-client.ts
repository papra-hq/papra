import { QueryClient } from '@tanstack/solid-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // retry: (failureCount, error) => {
      //   const status = get(error, 'status');

      //   if (status && [401, 403, 404].includes(status)) {
      //     return false;
      //   }

      //   return failureCount < 3;
      // },
      retry: false,
    },
  },
});

export function clearQueryCache() {
  queryClient.clear();
}
