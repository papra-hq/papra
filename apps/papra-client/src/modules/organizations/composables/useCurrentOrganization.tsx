import type { ParentComponent } from 'solid-js';
import type { Organization } from '../organizations.types';
import { useQuery } from '@tanstack/solid-query';
import { createContext, Show, useContext } from 'solid-js';
import { createPersistedSignal } from '@/modules/shared/signals/persistence/persistence.signals';
import { fetchOrganizations } from '../organizations.services';

const currentOrganizationContext = createContext<{
  organizations: Organization[];
  getCurrentOrganization: () => Organization;
  setCurrentOrganization: ({ organizationId }: { organizationId: string }) => void;
}>();

export function useCurrentOrganization() {
  const context = useContext(currentOrganizationContext);

  if (!context) {
    throw new Error('useCurrentOrganization must be used within a CurrentOrganizationProvider');
  }

  return context;
}

export const CurrentOrganizationProvider: ParentComponent = (props) => {
  const [getCurrentOrganizationId, setCurrentOrganizationId] = createPersistedSignal<string | null>(
    null,
    { key: 'papra_current_organization_id', storage: localStorage },
  );

  const query = useQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  return (
    <Show when={query.data}>
      {(getData) => (
        <currentOrganizationContext.Provider
          value={{
            organizations: getData().organizations,
            getCurrentOrganization: () =>
              getData().organizations.find(
                (organization) => organization.id === getCurrentOrganizationId(),
              ) ?? getData().organizations[0],
            setCurrentOrganization: ({ organizationId }) => {
              setCurrentOrganizationId(organizationId);
            },
          }}
        >
          {props.children}
        </currentOrganizationContext.Provider>
      )}
    </Show>
  );
};
