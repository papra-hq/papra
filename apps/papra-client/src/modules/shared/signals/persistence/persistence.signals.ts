import type { Setter } from 'solid-js';
import { createSignal } from 'solid-js';

export function createPersistedSignal<T>(
  initialValue: T,
  {
    key,
    storage = window.localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  }: {
    key: string;
    storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  },
) {
  const readInitialValue = (): T => {
    const storedValue = storage.getItem(key);

    if (storedValue === null) {
      return initialValue;
    }

    try {
      return deserialize(storedValue);
    } catch {
      return initialValue;
    }
  };

  const persist = (value: T) => {
    try {
      if (value == null) {
        storage.removeItem(key);
        return;
      }

      storage.setItem(key, serialize(value));
    } catch {}
  };

  const [getValue, setValue] = createSignal<T>(readInitialValue());

  const setAndPersist = ((value?: unknown) => {
    const newValue = (setValue as (value?: unknown) => T)(value);
    persist(newValue);
    return newValue;
  }) as Setter<T>;

  return [getValue, setAndPersist] as const;
}
