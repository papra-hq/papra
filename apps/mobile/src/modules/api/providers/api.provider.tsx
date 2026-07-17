import type { ReactNode } from 'react';
import type { ApiClient } from '@/modules/api/api.client';
import type { AuthClient } from '@/modules/auth/auth.client';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';
import { createApiClient } from '@/modules/api/api.client';
import { createAuthClient } from '@/modules/auth/auth.client';
import { configQueryOptions } from '@/modules/config/config.queries';

type ApiProviderProps = {
  children: ReactNode;
};

const AuthClientContext = createContext<AuthClient | undefined>(undefined);
const ApiClientContext = createContext<ApiClient | undefined>(undefined);

export function ApiProvider({ children }: ApiProviderProps) {
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(undefined);
  const [apiClient, setApiClient] = useState<ApiClient | undefined>(undefined);

  const { data: apiServerConfig } = useQuery(configQueryOptions);

  useEffect(() => {
    if (apiServerConfig == null) {
      return;
    }

    const { baseUrl, customHeaders } = apiServerConfig;

    const authClient = createAuthClient({ baseUrl, customHeaders });
    setAuthClient(() => authClient);

    const apiClient = createApiClient({
      baseUrl,
      customHeaders,
      getAuthCookie: () => authClient.getCookie(),
    });
    setApiClient(() => apiClient);
  }, [apiServerConfig]);

  return (
    <>
      {authClient && apiClient && (
        <AuthClientContext.Provider value={authClient}>
          <ApiClientContext.Provider value={apiClient}>{children}</ApiClientContext.Provider>
        </AuthClientContext.Provider>
      )}
    </>
  );
}

export function useAuthClient(): AuthClient {
  const context = useContext(AuthClientContext);

  if (!context) {
    throw new Error('useAuthClient must be used within ApiProvider');
  }

  return context;
}

export function useApiClient(): ApiClient {
  const context = useContext(ApiClientContext);

  if (!context) {
    throw new Error('useApiClient must be used within ApiProvider');
  }

  return context;
}
