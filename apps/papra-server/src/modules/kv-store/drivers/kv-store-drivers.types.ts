import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { JsonSerializableValue } from '../kv-store.types';

export type KvStoreDriver = {
  name: string;
  get: (key: string) => Promise<JsonSerializableValue | undefined>;
  set: (key: string, value: JsonSerializableValue, options?: { ttlMs?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export type KvStoreDriverFactory = (args: { config: Config; db: Database }) => KvStoreDriver;
