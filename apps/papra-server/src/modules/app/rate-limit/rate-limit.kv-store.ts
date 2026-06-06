import type { KvStore } from '../../kv-store/kv-store.types';
import type { RateLimitKvStore } from './rate-limit.types';
import * as v from 'valibot';
import { positiveIntegerSchema } from '../../shared/schemas/number.schemas';

const rateLimitKvStoreEntrySchema = v.object({
  hitCount: positiveIntegerSchema,
  resetAtEpochMs: positiveIntegerSchema,
});

export function scopeKvStoreForRateLimit({ kvStore }: { kvStore: KvStore }): RateLimitKvStore {
  return kvStore.defineScope({
    prefix: 'rate-limit',
    schema: rateLimitKvStoreEntrySchema,
  });
}
