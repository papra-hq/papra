import { describe, expect, test } from 'vitest';
import { createPersistedSignal } from './persistence.signals';

function createTestStorage(initialEntries: Record<string, string> = {}) {
  const storage = new Map<string, string>(Object.entries(initialEntries));

  return {
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    getStorage() {
      return Object.fromEntries(storage.entries());
    },
  };
}

describe('persistence.signals', () => {
  describe('createPersistedSignal', () => {
    describe('it behaves like a regular signal', () => {
      test('it is created with the initial value and reflects updates', () => {
        const storage = createTestStorage();
        const [getValue, setValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(getValue()).to.eql('initial');

        setValue('updated');
        expect(getValue()).to.eql('updated');
      });

      test('it supports the functional updater form, like createSignal', () => {
        const storage = createTestStorage();
        const [getValue, setValue] = createPersistedSignal(1, { key: 'test-key', storage });

        setValue((previous) => previous + 1);

        expect(getValue()).to.eql(2);
        expect(storage.getStorage()).to.eql({ 'test-key': '2' });
      });

      test('the setter returns the new value, like createSignal', () => {
        const storage = createTestStorage();
        const [, setValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(setValue('updated')).to.eql('updated');
      });
    });

    describe('the initial value is never written to storage on its own', () => {
      test('creating the signal does not write anything to storage', () => {
        const storage = createTestStorage();
        createPersistedSignal('initial', { key: 'test-key', storage });

        expect(storage.getStorage()).to.eql({});
      });

      test('storage is only written once a value is explicitly set', () => {
        const storage = createTestStorage();
        const [, setValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(storage.getStorage()).to.eql({});

        setValue('updated');
        expect(storage.getStorage()).to.eql({ 'test-key': '"updated"' });
      });
    });

    describe('a previously persisted value is restored when the signal is created', () => {
      test('the stored value takes precedence over the initial value', () => {
        const storage = createTestStorage({ 'test-key': '"stored"' });
        const [getValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(getValue()).to.eql('stored');
      });

      test('non-string values are deserialized from their JSON representation', () => {
        const storage = createTestStorage({ 'test-key': '42' });
        const [getValue] = createPersistedSignal<number | null>(null, { key: 'test-key', storage });

        expect(getValue()).to.eql(42);
      });

      test('the initial value is used when the stored value cannot be deserialized', () => {
        const storage = createTestStorage({ 'test-key': 'not-json' });
        const [getValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(getValue()).to.eql('initial');
      });
    });

    describe('every explicit set is persisted', () => {
      test('a value is persisted even when it is equal to the initial value', () => {
        // This guards against tying persistence to a (possibly dynamic) initial value: an explicit
        // choice that happens to match the default must still survive a reload.
        const storage = createTestStorage();
        const [, setValue] = createPersistedSignal('en', { key: 'test-key', storage });

        setValue('en');

        expect(storage.getStorage()).to.eql({ 'test-key': '"en"' });
      });

      test('setting null removes the key from storage instead of writing it', () => {
        const storage = createTestStorage();
        const [, setValue] = createPersistedSignal<string | null>(null, {
          key: 'test-key',
          storage,
        });

        setValue('something');
        expect(storage.getStorage()).to.eql({ 'test-key': '"something"' });

        setValue(null);
        expect(storage.getStorage()).to.eql({});
      });

      test('setting undefined removes the key from storage instead of writing it', () => {
        const storage = createTestStorage({ 'test-key': '"something"' });
        const [getValue, setValue] = createPersistedSignal<string | undefined>(undefined, {
          key: 'test-key',
          storage,
        });

        setValue(undefined);

        expect(storage.getStorage()).to.eql({});

        expect(getValue()).to.eql(undefined);
      });
    });

    describe('it is resilient to storage and serialization failures', () => {
      test('a value that cannot be serialized does not throw', () => {
        const storage = createTestStorage();
        const [getValue, setValue] = createPersistedSignal<unknown>('initial', {
          key: 'test-key',
          storage,
          serialize: () => {
            throw new Error('cannot serialize');
          },
        });

        expect(() => setValue('updated')).not.toThrow();
        // The in-memory signal is still updated even when persistence fails.
        expect(getValue()).to.eql('updated');
      });

      test('a storage that throws on write does not throw', () => {
        const storage = {
          getItem: () => null,
          setItem: () => {
            throw new Error('quota exceeded');
          },
          removeItem: () => {},
        };

        const [getValue, setValue] = createPersistedSignal('initial', { key: 'test-key', storage });

        expect(() => setValue('updated')).not.toThrow();
        expect(getValue()).to.eql('updated');
      });
    });

    describe('serialization can be customized', () => {
      test('custom serialize and deserialize functions are used to round-trip the value', () => {
        const options = {
          key: 'test-key',
          serialize: (value: { count: number }) => `count=${value.count}`,
          deserialize: (value: string) => ({ count: Number(value.replace('count=', '')) }),
        };
        const storage = createTestStorage();

        const [, setValue] = createPersistedSignal({ count: 0 }, { ...options, storage });
        setValue({ count: 3 });

        expect(storage.getStorage()).to.eql({ 'test-key': 'count=3' });

        const [getRestored] = createPersistedSignal({ count: 0 }, { ...options, storage });
        expect(getRestored()).to.eql({ count: 3 });
      });
    });
  });
});
