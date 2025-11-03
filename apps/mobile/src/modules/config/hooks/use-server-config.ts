import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { fetchServerConfig } from '../config.services';

export function useServerConfig() {
  const apiClient = useApiClient();

  return useQuery({
    queryKey: ['server', 'config'],
    queryFn: async () => fetchServerConfig({ apiClient }),
  });
}
