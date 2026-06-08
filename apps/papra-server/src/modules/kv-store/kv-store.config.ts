import type { AppConfigDefinition } from '../config/config.types';
import * as v from 'valibot';
import { kvStoreDriverNames } from './drivers/kv-store-drivers.registry';
import { LIBSQL_KV_STORE_DRIVER_NAME } from './drivers/libsql/libsql.kv-store-driver';

export const kvStoreConfig = {
  driverName: {
    doc: `The driver to use for the key-value store, value can be one of: ${kvStoreDriverNames.map((x) => `\`${x}\``).join(', ')}`,
    schema: v.picklist(kvStoreDriverNames),
    default: LIBSQL_KV_STORE_DRIVER_NAME,
    env: 'KV_STORE_DRIVER',
  },
} as const satisfies AppConfigDefinition;
