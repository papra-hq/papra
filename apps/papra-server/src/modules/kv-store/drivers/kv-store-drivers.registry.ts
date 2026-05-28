import type { KvStoreDriverFactory } from './kv-store-drivers.types';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { createInMemoryKvStoreDriver, IN_MEMORY_KV_STORE_DRIVER_NAME } from './in-memory/in-memory.kv-store-driver';
import { createLibsqlKvStoreDriver, LIBSQL_KV_STORE_DRIVER_NAME } from './libsql/libsql.kv-store-driver';

export const kvStoreDriverFactories = {
  [IN_MEMORY_KV_STORE_DRIVER_NAME]: createInMemoryKvStoreDriver,
  [LIBSQL_KV_STORE_DRIVER_NAME]: ({ db }) => createLibsqlKvStoreDriver({ db }),
} satisfies Record<string, KvStoreDriverFactory>;

export const kvStoreDriverNames = Object.keys(kvStoreDriverFactories) as (keyof typeof kvStoreDriverFactories)[];

export type KvStoreDriverName = keyof typeof kvStoreDriverFactories;

export function getKvStoreDriverFactory({ driverName}: { driverName: KvStoreDriverName }): KvStoreDriverFactory {
  const factory = kvStoreDriverFactories[driverName];

  if (isNil(factory)) {
    throw createError({
      code: 'kv_store.invalid_driver',
      message: `Invalid key-value store driver name: ${driverName}`,
      statusCode: 500,
      isInternal: true,
    });
  }

  return factory;
}
