import type { Database } from '../../app/database/database.types';
import type { Config } from '../../config/config.types';
import type { Clock } from '../../shared/clock/clock.types';
import type { JsonSerializableValue } from '../kv-store.types';

export type KvStoreDriver = {
  name: string;
  get: (args: { key: string }) => Promise<JsonSerializableValue | undefined>;
  set: (args: {
    key: string;
    value: JsonSerializableValue;
    expiresAt?: Temporal.Instant;
  }) => Promise<void>;
  delete: (args: { key: string }) => Promise<void>;
  // Optional bulk purge of expired entries, only implemented by lazy-delete drivers (e.g. libsql) that would otherwise accumulate expired rows.
  deleteExpired?: () => Promise<{ deletedCount: number }>;
};

export type KvStoreDriverFactory = (args: {
  config: Config;
  db: Database;
  clock?: Clock;
}) => KvStoreDriver;
