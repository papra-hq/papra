import type { ReactNode } from 'react';
import type { Organization } from '@/modules/organizations/organizations.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { isHttpClientError } from '../api/http.client';
import { useApiClient } from '../api/providers/api.provider';
import { organizationsLocalStorage } from './organizations.local-storage';
import { fetchOrganizations } from './organizations.services';

type OrganizationsContextValue = {
  currentOrganizationId: string | null;
  setCurrentOrganizationId: (organizationId: string) => Promise<void>;
  organizations: Organization[];
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null);

type OrganizationsProviderProps = {
  children: ReactNode;
};

export function OrganizationsProvider({ children }: OrganizationsProviderProps) {
  const router = useRouter();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [currentOrganizationId, setCurrentOrganizationIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => fetchOrganizations({ apiClient }),
  });

  // Load current organization ID from storage on mount
  useEffect(() => {
    const loadCurrentOrganizationId = async () => {
      const storedOrgId = await organizationsLocalStorage.getCurrentOrganizationId();
      setCurrentOrganizationIdState(storedOrgId);
      setIsInitialized(true);
    };

    void loadCurrentOrganizationId();
  }, []);

  const setCurrentOrganizationId = async (organizationId: string) => {
    await organizationsLocalStorage.setCurrentOrganizationId(organizationId);
    setCurrentOrganizationIdState(organizationId);
  };

  useEffect(() => {
    if (!isInitialized || organizationsQuery.isLoading) {
      return;
    }

    if (organizationsQuery.error) {
      const error = organizationsQuery.error;

      if (isHttpClientError(error) && error.status === 401) {
        router.replace('/auth/login');
        return;
      }

      router.replace('/config/server-selection');
      return;
    }

    const organizations = organizationsQuery.data?.organizations ?? [];

    if (organizations.length === 0) {
      // No organizations, redirect to organization create to create one
      router.replace('/(app)/(with-organizations)/organizations/create');
      return;
    }

    // If there's no current org set, or the current org doesn't exist anymore, set to first org
    if (currentOrganizationId == null || !organizations.some(org => org.id === currentOrganizationId)) {
      const firstOrg = organizations[0];
      if (firstOrg) {
        void setCurrentOrganizationId(firstOrg.id);
      }
    }
  }, [isInitialized, organizationsQuery.isLoading, organizationsQuery.data, currentOrganizationId, router]);

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['organizations'] });
  };

  const value: OrganizationsContextValue = {
    currentOrganizationId,
    setCurrentOrganizationId,
    organizations: organizationsQuery.data?.organizations ?? [],
    isLoading: organizationsQuery.isLoading || !isInitialized,
    refetch,
  };

  return (
    <OrganizationsContext.Provider value={value}>
      {children}
    </OrganizationsContext.Provider>
  );
}

export function useOrganizations(): OrganizationsContextValue {
  const context = useContext(OrganizationsContext);

  if (!context) {
    throw new Error('useOrganizations must be used within OrganizationsProvider');
  }

  return context;
}
