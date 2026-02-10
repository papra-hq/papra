import { makePersisted } from '@solid-primitives/storage';
import { createSignal } from 'solid-js';

export function useLastOrganization() {
  // TODO: migrate the persistence key to use the buildLocalStorageKey function from the persistence models
  const [getLatestOrganizationId, setLatestOrganizationId] = makePersisted(createSignal<string | null>(null), { name: 'papra_current_organization_id', storage: localStorage });

  return {
    getLatestOrganizationId,
    setLatestOrganizationId,
  };
}
