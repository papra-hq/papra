import type { Database } from '../../../app/database/database.types';
import type { KvStoreDriver } from '../kv-store-drivers.types';
import { createKvStoreRepository } from './libsql.kv-store-driver.repository';

export const LIBSQL_KV_STORE_DRIVER_NAME = 'libsql';

export function createLibsqlKvStoreDriver({ db }: { db: Database }): KvStoreDriver {
  const repository = createKvStoreRepository({ db });

  return {
    name: LIBSQL_KV_STORE_DRIVER_NAME,

    get: async (key, now = new Date()) => {
      const { entry } = await repository.getEntry({ key });

      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt !== null && entry.expiresAt.getTime() <= now.getTime()) {
        // Lazy expiration: drop the entry on read once it has expired,
        // with re-cheking in case of race conditions
        await repository.deleteExpiredEntry({ key, now });
        return undefined;
      }

      return entry.value;
    },

    set: async (key, value, { ttlMs } = {}, now = new Date()) => {
      if (ttlMs !== undefined && ttlMs <= 0) {
        await repository.deleteEntry({ key });
        return;
      }

      const expiresAt = ttlMs === undefined ? null : new Date(now.getTime() + ttlMs);

      await repository.upsertEntry({ key, value, expiresAt });
    },

    delete: async (key) => {
      await repository.deleteEntry({ key });
    },

    deleteExpired: async (now = new Date()) => {
      return repository.deleteAllExpiredEntries({ now });
    },

  };
}
