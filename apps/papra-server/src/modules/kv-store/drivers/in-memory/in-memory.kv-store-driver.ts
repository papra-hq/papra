import type { JsonSerializableValue } from '../../kv-store.types';
import type { KvStoreDriver } from '../kv-store-drivers.types';

export const IN_MEMORY_KV_STORE_DRIVER_NAME = 'in-memory';

type Entry = {
  value: JsonSerializableValue;
  expiresAt: number | undefined;
  timer: NodeJS.Timeout | undefined;
};

export function createInMemoryKvStoreDriver(): KvStoreDriver {
  const store = new Map<string, Entry>();

  const clearKey = (key: string) => {
    const entry = store.get(key);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    store.delete(key);
  };

  return {
    name: IN_MEMORY_KV_STORE_DRIVER_NAME,

    get: async (key, now = new Date()) => {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt !== undefined && entry.expiresAt <= now.getTime()) {
        clearKey(key);
        return undefined;
      }

      return entry.value;
    },

    set: async (key, value, { ttlMs } = {}, now = new Date()) => {
      clearKey(key);

      if (ttlMs !== undefined && ttlMs <= 0) {
        return;
      }

      const expiresAt = ttlMs === undefined ? undefined : now.getTime() + ttlMs;
      const timer = ttlMs === undefined ? undefined : setTimeout(() => clearKey(key), ttlMs);
      timer?.unref?.();

      store.set(key, { value, expiresAt, timer });
    },

    delete: async (key) => {
      clearKey(key);
    },

  };
}
