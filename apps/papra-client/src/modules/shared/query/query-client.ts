import { QueryClient } from '@tanstack/solid-query';

export const queryClient = new QueryClient();

export function clearQueryCache() {
  queryClient.clear();
}
