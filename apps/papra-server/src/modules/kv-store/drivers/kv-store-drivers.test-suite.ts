import type { KvStore, KvStoreScope } from '../kv-store.types';
import type { KvStoreDriver } from './kv-store-drivers.types';
import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import { createTestLogger } from '../../shared/logger/logger.test-utils';
import { createKvStore } from '../kv-store';

type GetLogsFn = ReturnType<typeof createTestLogger>['getLogs'];

export function runKvStoreDriverTestSuite(createKvStoreDriver: () => Promise<{ driver: KvStoreDriver; clear?: () => Promise<void> }>) {
  const withKvStore = (fn: (args: {
    kvStore: KvStore;
    getLogs: GetLogsFn;
    scopedKvStore: KvStoreScope<string>;
  }) => Promise<void>) => async () => {
    const { driver, clear } = await createKvStoreDriver();
    const { logger, getLogs } = createTestLogger();

    const kvStore = createKvStore({ driver, logger });
    const scopedKvStore = kvStore.defineScope({
      prefix: 'test',
      schema: v.string(),
    });

    await fn({ kvStore, getLogs, scopedKvStore });

    await clear?.();
  };

  describe('KVStore', () => {
    test('set and get a value', withKvStore(async ({ scopedKvStore }) => {
      await scopedKvStore.set('key1', 'value1');
      expect(await scopedKvStore.get('key1')).to.eql('value1');
    }));

    test('return undefined for non existing keys', withKvStore(async ({ scopedKvStore }) => {
      expect(await scopedKvStore.get('non-existing-key')).to.eql(undefined);
    }));

    test('delete a value', withKvStore(async ({ scopedKvStore }) => {
      await scopedKvStore.set('key1', 'value1');
      expect(await scopedKvStore.get('key1')).to.eql('value1');
      await scopedKvStore.delete('key1');
      expect(await scopedKvStore.get('key1')).to.eql(undefined);
    }));

    test('delete a non existing key should not throw', withKvStore(async ({ scopedKvStore }) => {
      await scopedKvStore.delete('non-existing-key');
    }));

    test('a value can be overwritten', withKvStore(async ({ scopedKvStore }) => {
      await scopedKvStore.set('key1', 'value1');
      expect(await scopedKvStore.get('key1')).to.eql('value1');
      await scopedKvStore.set('key1', 'value2');
      expect(await scopedKvStore.get('key1')).to.eql('value2');
    }));

    describe('TTL', () => {
      test('expire a value after TTL', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        vi.advanceTimersByTime(1_001);

        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        vi.useRealTimers();
      }));

      test('reset TTL on set', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        vi.advanceTimersByTime(500);

        expect(await scopedKvStore.get('key1')).to.eql('value1');

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });

        vi.advanceTimersByTime(500);

        expect(await scopedKvStore.get('key1')).to.eql('value1');

        vi.advanceTimersByTime(500);

        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        vi.useRealTimers();
      }));

      test('overwrite a value without TTL should remove the previous TTL', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        await scopedKvStore.set('key1', 'value1');
        vi.advanceTimersByTime(1_001);

        expect(await scopedKvStore.get('key1')).to.eql('value1');

        vi.useRealTimers();
      }));

      test('overwrite a value with a shorter TTL should update the TTL', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        await scopedKvStore.set('key1', 'value1', { ttlMs: 500 });
        vi.advanceTimersByTime(501);

        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        vi.useRealTimers();
      }));

      test('ttl does not affect other keys', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        await scopedKvStore.set('key2', 'value2');
        expect(await scopedKvStore.get('key1')).to.eql('value1');
        expect(await scopedKvStore.get('key2')).to.eql('value2');

        vi.advanceTimersByTime(1_001);

        expect(await scopedKvStore.get('key1')).to.eql(undefined);
        expect(await scopedKvStore.get('key2')).to.eql('value2');

        vi.useRealTimers();
      }));

      test('a negative or zero TTL is considered as expiring immediatly, so the value should not be set', withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.set('key1', 'value1', { ttlMs: 0 });
        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        await scopedKvStore.set('key2', 'value2', { ttlMs: -1 });
        expect(await scopedKvStore.get('key2')).to.eql(undefined);
      }));

      test('when a negative or zero TTL is set when overwriting an existing value, the value should be deleted', withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.set('key1', 'value1');
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        await scopedKvStore.set('key1', 'value1', { ttlMs: 0 });
        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        await scopedKvStore.set('key2', 'value2', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key2')).to.eql('value2');

        await scopedKvStore.set('key2', 'value2', { ttlMs: -1 });
        expect(await scopedKvStore.get('key2')).to.eql(undefined);
      }));

      test('setting a value with TTL and then deleting it should not cause issues', withKvStore(async ({ scopedKvStore }) => {
        vi.useFakeTimers();

        await scopedKvStore.set('key1', 'value1', { ttlMs: 1_000 });
        expect(await scopedKvStore.get('key1')).to.eql('value1');

        await scopedKvStore.delete('key1');
        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        vi.advanceTimersByTime(1_001);

        expect(await scopedKvStore.get('key1')).to.eql(undefined);

        vi.useRealTimers();
      }));
    });
  });
}
