import type { KvStoreScope } from '../../kv-store/kv-store.types';

export type RateLimitKvStore = KvStoreScope<{
  hitCount: number;
  resetAtEpochMs: number;
}>;
