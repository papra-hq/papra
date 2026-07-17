import { queryOptions } from '@tanstack/react-query';
import { configLocalStorage } from './config.local-storage';

export const configQueryOptions = queryOptions({
  queryKey: ['api-server-config'],
  queryFn: configLocalStorage.getApiServerConfig,
});
