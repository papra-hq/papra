import { createPersistedSignal } from '@/modules/shared/signals/persistence/persistence.signals';

export function useLastOrganization() {
  // TODO: migrate the persistence key to use the buildLocalStorageKey function from the persistence models
  const [getLatestOrganizationId, setLatestOrganizationId] = createPersistedSignal<string | null>(
    null,
    { key: 'papra_current_organization_id', storage: localStorage },
  );

  return {
    getLatestOrganizationId,
    setLatestOrganizationId,
  };
}
