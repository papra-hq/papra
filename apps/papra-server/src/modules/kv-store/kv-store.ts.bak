import type { Database } from '../app/database/database.types';
import type { Config } from '../config/config.types';
import type { Logger } from '../shared/logger/logger';
import type { KvStoreDriver } from './drivers/kv-store-drivers.types';
import type { KvStore } from './kv-store.types';
import * as v from 'valibot';
import { createLogger } from '../shared/logger/logger';
import { getKvStoreDriverFactory } from './drivers/kv-store-drivers.registry';
import { createInvalidKvStoreValueError } from './kv-store.errors';
import { joinKeyParts } from './kv-store.models';

export function createKvStore({
  driver,
  logger = createLogger({ namespace: 'kv-store' }),
}: {
  driver: KvStoreDriver;
  logger?: Logger;
}): KvStore {
  return {
    ...(driver.deleteExpired ? { purgeExpired: driver.deleteExpired } : {}),

    defineScope: ({ prefix, schema }) => {
      const buildKey = (key: string) => joinKeyParts([prefix, key]);

      return {
        get: async (key) => {
          const fullKey = buildKey(key);
          const raw = await driver.get({ key: fullKey });

          if (raw === undefined) {
            return undefined;
          }

          const parsed = v.safeParse(schema, raw);

          if (!parsed.success) {
            // Drop entries that no longer match the schema (e.g. shape changed between deploys) so they don't poison every future read.
            logger.warn(
              { prefix, key, issues: parsed.issues },
              'Dropping kv entry that fails schema validation',
            );
            await driver.delete({ key: fullKey });
            return undefined;
          }

          return parsed.output;
        },

        set: async (key, value, { expiresAt } = {}) => {
          const parsed = v.safeParse(schema, value);

          if (!parsed.success) {
            logger.error(
              { prefix, key, issues: parsed.issues },
              'Failed to set kv entry because value fails schema validation',
            );
            throw createInvalidKvStoreValueError();
          }

          await driver.set({ key: buildKey(key), value: parsed.output, expiresAt });
        },

        delete: async (key) => {
          await driver.delete({ key: buildKey(key) });
        },
      };
    },
  };
}

export function buildKvStore({ config, db }: { config: Config; db: Database }): KvStore {
  const { driverName } = config.kvStore;

  const driverFactory = getKvStoreDriverFactory({ driverName });

  const driver = driverFactory({ config, db });

  return createKvStore({ driver });
}
