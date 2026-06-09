import type { Clock } from '../../../shared/clock/clock.types';
import type { JsonSerializableValue } from '../../kv-store.types';
import type { KvStoreDriver } from '../kv-store-drivers.types';
import { systemClock } from '../../../shared/clock/clock';
import { createUnrefTimeout } from '../../../shared/timers';

export const IN_MEMORY_KV_STORE_DRIVER_NAME = 'in-memory';
export const MAX_TIMER_DELAY_MS = 2 ** 31 - 1; // Maximum delay for setTimeout in Node.js

type Entry = {
  value: JsonSerializableValue;
  expiresAtMsEpoch: number | undefined;
  timer: NodeJS.Timeout | undefined;
};

export function createInMemoryKvStoreDriver({
  clock = systemClock,
}: { clock?: Clock } = {}): KvStoreDriver {
  const store = new Map<string, Entry>();

  const clearKey = (key: string) => {
    const entry = store.get(key);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    store.delete(key);
  };

  return {
    name: IN_MEMORY_KV_STORE_DRIVER_NAME,

    get: async ({ key }) => {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }

      // The timer set below is best-effort eager cleanup, but the event loop can be blocked or timers paused, so this
      // read-time comparison against the clock is the authoritative expiry check.
      if (
        entry.expiresAtMsEpoch !== undefined &&
        entry.expiresAtMsEpoch <= clock.now().epochMilliseconds
      ) {
        clearKey(key);
        return undefined;
      }

      return entry.value;
    },

    set: async ({ key, value, expiresAt }) => {
      clearKey(key);

      // An expiry at or before now means the value is already dead: drop it rather than storing an immediately-expired entry.
      if (hasExpirationInThePast({ expiresAt, clock })) {
        return;
      }

      const { expiresAtMsEpoch, timerDurationMs } = resolveExpiration({ expiresAt, clock });

      const timer =
        timerDurationMs === undefined
          ? undefined
          : createUnrefTimeout(() => clearKey(key), timerDurationMs);

      store.set(key, { value, expiresAtMsEpoch, timer });
    },

    delete: async ({ key }) => {
      clearKey(key);
    },
  };
}

function hasExpirationInThePast({
  expiresAt,
  clock,
}: {
  expiresAt?: Temporal.Instant;
  clock: Clock;
}) {
  if (expiresAt === undefined) {
    return false;
  }

  return expiresAt.epochMilliseconds <= clock.now().epochMilliseconds;
}

function resolveExpiration({ expiresAt, clock }: { expiresAt?: Temporal.Instant; clock: Clock }): {
  expiresAtMsEpoch?: number;
  timerDurationMs?: number;
} {
  if (expiresAt === undefined) {
    return { expiresAtMsEpoch: undefined, timerDurationMs: undefined };
  }

  const nowMsEpoch = clock.now().epochMilliseconds;
  const expiresAtMsEpoch = expiresAt.epochMilliseconds;

  if (expiresAtMsEpoch <= nowMsEpoch) {
    return { expiresAtMsEpoch, timerDurationMs: undefined };
  }

  const timerDurationMs = expiresAtMsEpoch - nowMsEpoch;

  if (timerDurationMs > MAX_TIMER_DELAY_MS) {
    return { expiresAtMsEpoch, timerDurationMs: undefined };
  }

  return { expiresAtMsEpoch, timerDurationMs };
}
