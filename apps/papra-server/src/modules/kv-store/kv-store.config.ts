import type { AppConfigDefinition } from '../config/config.types';
import * as v from 'valibot';
import { IN_MEMORY_KV_STORE_DRIVER_NAME } from './drivers/in-memory/in-memory.kv-store-driver';
import { kvStoreDriverNames } from './drivers/kv-store-drivers.registry';

export const kvStoreConfig = {
  driverName: {
    doc: `The driver to use for the key-value store, value can be one of: ${kvStoreDriverNames.map(x => `\`${x}\``).join(', ')}`,
    schema: v.picklist(kvStoreDriverNames),
    default: IN_MEMORY_KV_STORE_DRIVER_NAME,
    env: 'KV_STORE_DRIVER',
  },
} as const satisfies AppConfigDefinition;
