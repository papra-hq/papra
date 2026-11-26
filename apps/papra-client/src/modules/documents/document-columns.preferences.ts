import type { Accessor, Setter } from 'solid-js';
import { createPersistedSignal } from '@/modules/shared/signals/persistence/persistence.signals';
import {
  DEFAULT_DOCUMENT_COLUMN_IDS,
  deserializeDocumentColumnIds,
  getDocumentColumnsStorageKey,
} from './document-columns.models';

export function createDocumentColumnPreferences({
  getOrganizationId,
  storage = localStorage,
}: {
  getOrganizationId: Accessor<string>;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}) {
  const preferencesByOrganizationId = new Map<
    string,
    ReturnType<typeof createPersistedSignal<string[]>>
  >();

  const getPreferences = () => {
    const organizationId = getOrganizationId();
    let preferences = preferencesByOrganizationId.get(organizationId);

    if (!preferences) {
      preferences = createPersistedSignal<string[]>([...DEFAULT_DOCUMENT_COLUMN_IDS], {
        key: getDocumentColumnsStorageKey({ organizationId }),
        storage,
        deserialize: deserializeDocumentColumnIds,
      });
      preferencesByOrganizationId.set(organizationId, preferences);
    }

    return preferences;
  };

  const getColumnIds = () => getPreferences()[0]();
  const setColumnIds: Setter<string[]> = (valueOrUpdater) => getPreferences()[1](valueOrUpdater);

  return [getColumnIds, setColumnIds] as const;
}
