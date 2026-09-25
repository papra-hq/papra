import type { Accessor, Setter } from 'solid-js';
import { createMemo } from 'solid-js';
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
  const getPreferences = createMemo(() =>
    createPersistedSignal<string[]>([...DEFAULT_DOCUMENT_COLUMN_IDS], {
      key: getDocumentColumnsStorageKey({ organizationId: getOrganizationId() }),
      storage,
      deserialize: deserializeDocumentColumnIds,
    }),
  );

  const getColumnIds = () => getPreferences()[0]();
  const setColumnIds: Setter<string[]> = (valueOrUpdater) => getPreferences()[1](valueOrUpdater);

  return [getColumnIds, setColumnIds] as const;
}
