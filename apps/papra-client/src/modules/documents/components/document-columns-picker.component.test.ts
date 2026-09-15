import type { ParentProps } from 'solid-js';
import type * as Solid from 'solid-js';
import { createComponent, createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DocumentColumnsPicker } from './document-columns-picker.component';

const { instances, labels } = vi.hoisted(() => {
  const instances: { disposed: boolean }[] = [];
  const labels: ParentProps<{ title?: string }>[] = [];
  return { instances, labels };
});

vi.mock('solid-js', async () => vi.importActual<typeof Solid>('solid-js/dist/solid.js'));

vi.mock('@/modules/i18n/i18n.provider', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/modules/ui/components/button', () => ({
  Button: (props: ParentProps) => props.children,
}));

vi.mock('@/modules/ui/components/popover', () => {
  const renderChildren = (props: ParentProps) => props.children;
  return {
    Popover: renderChildren,
    PopoverContent: renderChildren,
    PopoverTitle: renderChildren,
    PopoverTrigger: renderChildren,
  };
});

vi.mock('@/modules/ui/components/checkbox', async () => {
  const { onCleanup } = await import('solid-js');
  return {
    Checkbox: (props: ParentProps) => {
      const instance = { disposed: false };
      instances.push(instance);
      onCleanup(() => {
        instance.disposed = true;
      });
      return props.children;
    },
    CheckboxControl: () => null,
    CheckboxLabel: (props: ParentProps<{ title?: string }>) => {
      labels.push(props);
      return props.children;
    },
  };
});

const disposers: (() => void)[] = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  instances.length = 0;
  labels.length = 0;
});

function setupPicker() {
  return createRoot((dispose) => {
    disposers.push(dispose);
    const [getColumns, setColumns] = createSignal([
      { id: 'tags', label: 'Tags' },
      { id: 'customProperty:priority', label: 'Priority' },
    ]);
    createComponent(DocumentColumnsPicker, {
      get columns() {
        return getColumns();
      },
      selectedColumnIds: ['tags', 'customProperty:priority'],
      onSelectedColumnIdsChange: () => {},
      isLoading: false,
      hasError: false,
      isRetrying: false,
      onRetry: () => {},
    });
    return { setColumns };
  });
}

describe('document column picker identity', () => {
  test('preserves checkbox instances and updates labels when definitions are refreshed', () => {
    const { setColumns } = setupPicker();
    expect(instances).toHaveLength(2);
    const priorityLabel = labels[1];

    setColumns([
      { id: 'tags', label: 'Tags' },
      { id: 'customProperty:priority', label: 'Importance' },
    ]);

    expect(instances).toHaveLength(2);
    expect(instances.every((instance) => !instance.disposed)).toBe(true);
    expect(priorityLabel.title).toBe('Importance');
  });

  test('replaces only the controls for definitions that were removed or added', () => {
    const { setColumns } = setupPicker();
    const [tags, priority] = instances;

    setColumns([
      { id: 'tags', label: 'Tags' },
      { id: 'customProperty:amount', label: 'Amount' },
    ]);

    expect(instances).toHaveLength(3);
    expect(tags.disposed).toBe(false);
    expect(priority.disposed).toBe(true);
    expect(instances.filter((instance) => !instance.disposed)).toHaveLength(2);
  });
});
