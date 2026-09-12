import type * as Solid from 'solid-js';
import { createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  DEFAULT_DOCUMENT_COLUMN_IDS,
  getDocumentColumnsStorageKey,
} from './document-columns.models';
import { createDocumentColumnPreferences } from './document-columns.preferences';

vi.mock('solid-js', async () => vi.importActual<typeof Solid>('solid-js/dist/solid.js'));

const disposers: (() => void)[] = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
});

function createTestStorage(initialEntries: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initialEntries));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    getEntries: () => Object.fromEntries(entries),
  };
}

function setupPreferences({
  organizationId = 'organization-a',
  storage = createTestStorage(),
} = {}) {
  return createRoot((dispose) => {
    disposers.push(dispose);
    const [getOrganizationId, setOrganizationId] = createSignal(organizationId);
    const [getColumnIds, setColumnIds] = createDocumentColumnPreferences({
      getOrganizationId,
      storage,
    });
    return { getColumnIds, setColumnIds, setOrganizationId };
  });
}

describe('document column preferences', () => {
  test('uses the built-in defaults without writing them to storage', () => {
    const storage = createTestStorage();
    const { getColumnIds } = setupPreferences({ storage });

    expect(getColumnIds()).to.eql(DEFAULT_DOCUMENT_COLUMN_IDS);
    expect(storage.getEntries()).to.eql({});
  });

  test('restores saved column order and preserves an explicitly empty selection', () => {
    const storage = createTestStorage();
    const { setColumnIds } = setupPreferences({ storage });

    setColumnIds(['createdAt', 'customProperty:property-a', 'tags']);
    expect(setupPreferences({ storage }).getColumnIds()).to.eql([
      'createdAt',
      'customProperty:property-a',
      'tags',
    ]);

    setColumnIds([]);
    expect(setupPreferences({ storage }).getColumnIds()).to.eql([]);
  });

  test('keeps preferences isolated when separate tabs update different organizations', () => {
    const storage = createTestStorage();
    const tabA = setupPreferences({ organizationId: 'organization-a', storage });
    const tabB = setupPreferences({ organizationId: 'organization-b', storage });

    tabA.setColumnIds(['tags']);
    tabB.setColumnIds(['createdAt']);

    expect(storage.getEntries()).to.eql({
      [getDocumentColumnsStorageKey({ organizationId: 'organization-a' })]: '["tags"]',
      [getDocumentColumnsStorageKey({ organizationId: 'organization-b' })]: '["createdAt"]',
    });
    expect(setupPreferences({ organizationId: 'organization-a', storage }).getColumnIds()).to.eql([
      'tags',
    ]);
  });

  test('switches storage when navigating between organizations', () => {
    const storage = createTestStorage();
    const { getColumnIds, setColumnIds, setOrganizationId } = setupPreferences({ storage });

    setColumnIds(['tags']);
    setOrganizationId('organization-b');
    expect(getColumnIds()).to.eql(DEFAULT_DOCUMENT_COLUMN_IDS);
    setColumnIds(['createdAt']);

    setOrganizationId('organization-a');
    expect(getColumnIds()).to.eql(['tags']);
    expect(setColumnIds((columnIds) => ['documentDate', ...columnIds])).to.eql([
      'documentDate',
      'tags',
    ]);
    setOrganizationId('organization-b');
    expect(getColumnIds()).to.eql(['createdAt']);
    setOrganizationId('organization-a');
    expect(getColumnIds()).to.eql(['documentDate', 'tags']);
  });

  test.each(['not-json', '{}', '["tags",42]'])(
    'uses defaults for invalid stored preferences: %s',
    (storedValue) => {
      const storage = createTestStorage({
        [getDocumentColumnsStorageKey({ organizationId: 'organization-a' })]: storedValue,
      });

      expect(setupPreferences({ storage }).getColumnIds()).to.eql(DEFAULT_DOCUMENT_COLUMN_IDS);
    },
  );
});
