import type { Database } from '../../../app/database/database.types';
import type { Clock } from '../../../shared/clock/clock.types';
import type { KvStoreDriver } from '../kv-store-drivers.types';
import { systemClock } from '../../../shared/clock/clock';
import { createKvStoreRepository } from './libsql.kv-store-driver.repository';

export const LIBSQL_KV_STORE_DRIVER_NAME = 'libsql';

export function createLibsqlKvStoreDriver({ db, clock = systemClock }: { db: Database; clock?: Clock }): KvStoreDriver {
  const repository = createKvStoreRepository({ db });

  return {
    name: LIBSQL_KV_STORE_DRIVER_NAME,

    get: async ({ key }) => {
      const { entry } = await repository.getEntry({ key });

      if (!entry) {
        return undefined;
      }

      const nowMsEpoch = clock.now().epochMilliseconds;

      if (entry.expiresAt !== null && entry.expiresAt <= nowMsEpoch) {
        // Lazy expiration: drop the entry on read once it has expired, re-checking against now to avoid races.
        await repository.deleteExpiredEntry({ key, nowMsEpoch });
        return undefined;
      }

      return entry.value;
    },

    set: async ({ key, value, expiresAt }) => {
      // An expiry at or before now means the value is already dead: drop any previous value rather than writing a stale row.
      if (expiresAt !== undefined && expiresAt.epochMilliseconds <= clock.now().epochMilliseconds) {
        await repository.deleteEntry({ key });
        return;
      }

      await repository.upsertEntry({ key, value, expiresAtMsEpoch: expiresAt?.epochMilliseconds ?? null });
    },

    delete: async ({ key }) => {
      await repository.deleteEntry({ key });
    },

    deleteExpired: async () => {
      return repository.deleteAllExpiredEntries({ nowMsEpoch: clock.now().epochMilliseconds });
    },

  };
}
