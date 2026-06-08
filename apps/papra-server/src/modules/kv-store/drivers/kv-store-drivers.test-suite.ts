import type { Clock, TestClock } from '../../shared/clock/clock.types';
import type { KvStore, KvStoreScope } from '../kv-store.types';
import type { KvStoreDriver } from './kv-store-drivers.types';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { createTestClock } from '../../shared/clock/clock.test-utils';
import { createTestLogger } from '../../shared/logger/logger.test-utils';
import { createKvStore } from '../kv-store';

type GetLogsFn = ReturnType<typeof createTestLogger>['getLogs'];

export function runKvStoreDriverTestSuite(
  createKvStoreDriver: (args: {
    clock: Clock;
  }) => Promise<{ driver: KvStoreDriver; clear?: () => Promise<void> }>,
) {
  const withKvStore =
    (
      fn: (args: {
        kvStore: KvStore;
        getLogs: GetLogsFn;
        scopedKvStore: KvStoreScope<string>;
        clock: TestClock;
      }) => Promise<void>,
    ) =>
    async () => {
      const { clock } = createTestClock();
      const { driver, clear } = await createKvStoreDriver({ clock });
      const { logger, getLogs } = createTestLogger();

      const kvStore = createKvStore({ driver, logger });
      const scopedKvStore = kvStore.defineScope({
        prefix: 'test',
        schema: v.string(),
      });

      await fn({ kvStore, getLogs, scopedKvStore, clock });

      await clear?.();
    };

  describe('KVStore', () => {
    test(
      'set and get a value',
      withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.set('key1', 'value1');
        expect(await scopedKvStore.get('key1')).to.eql('value1');
      }),
    );

    test(
      'return undefined for non existing keys',
      withKvStore(async ({ scopedKvStore }) => {
        expect(await scopedKvStore.get('non-existing-key')).to.eql(undefined);
      }),
    );

    test(
      'delete a value',
      withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.set('key1', 'value1');
        expect(await scopedKvStore.get('key1')).to.eql('value1');
        await scopedKvStore.delete('key1');
        expect(await scopedKvStore.get('key1')).to.eql(undefined);
      }),
    );

    test(
      'delete a non existing key should not throw',
      withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.delete('non-existing-key');
      }),
    );

    test(
      'a value can be overwritten',
      withKvStore(async ({ scopedKvStore }) => {
        await scopedKvStore.set('key1', 'value1');
        expect(await scopedKvStore.get('key1')).to.eql('value1');
        await scopedKvStore.set('key1', 'value2');
        expect(await scopedKvStore.get('key1')).to.eql('value2');
      }),
    );

    describe('expiration', () => {
      test(
        'a value is no longer returned once its expiry instant has passed',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          clock.advanceBy({ milliseconds: 1_001 });

          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );

      test(
        'setting a value again pushes back its expiry instant',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          clock.advanceBy({ milliseconds: 500 });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          // Re-set relative to the new "now", moving the expiry another second out.
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });

          clock.advanceBy({ milliseconds: 500 });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          clock.advanceBy({ milliseconds: 501 });
          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );

      test(
        'overwriting a value without an expiry clears the previous expiry',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          await scopedKvStore.set('key1', 'value1');
          clock.advanceBy({ milliseconds: 1_001 });

          expect(await scopedKvStore.get('key1')).to.eql('value1');
        }),
      );

      test(
        'overwriting a value with an earlier expiry updates the expiry',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 500 }),
          });
          clock.advanceBy({ milliseconds: 501 });

          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );

      test(
        'expiry of one key does not affect other keys',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          await scopedKvStore.set('key2', 'value2');
          expect(await scopedKvStore.get('key1')).to.eql('value1');
          expect(await scopedKvStore.get('key2')).to.eql('value2');

          clock.advanceBy({ milliseconds: 1_001 });

          expect(await scopedKvStore.get('key1')).to.eql(undefined);
          expect(await scopedKvStore.get('key2')).to.eql('value2');
        }),
      );

      test(
        'an expiry at or before now means the value is not stored',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', { expiresAt: clock.now() });
          expect(await scopedKvStore.get('key1')).to.eql(undefined);

          await scopedKvStore.set('key2', 'value2', {
            expiresAt: clock.now().subtract({ milliseconds: 1 }),
          });
          expect(await scopedKvStore.get('key2')).to.eql(undefined);
        }),
      );

      test(
        'overwriting an existing value with a past expiry deletes it',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1');
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          await scopedKvStore.set('key1', 'value1', { expiresAt: clock.now() });
          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );

      test(
        'setting a value with an expiry and then deleting it does not resurrect it',
        withKvStore(async ({ scopedKvStore, clock }) => {
          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ milliseconds: 1_000 }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          await scopedKvStore.delete('key1');
          expect(await scopedKvStore.get('key1')).to.eql(undefined);

          clock.advanceBy({ milliseconds: 1_001 });

          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );

      test(
        'the expiration duration can exceed the maximum timer delay of the environment (e.g. ~24.8 days for setTimeout in Node)',
        withKvStore(async ({ scopedKvStore, clock }) => {
          const tenYearsInHours = 10 * 365 * 24;

          await scopedKvStore.set('key1', 'value1', {
            expiresAt: clock.now().add({ hours: tenYearsInHours }),
          });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          clock.advanceBy({ hours: tenYearsInHours - 1 });
          expect(await scopedKvStore.get('key1')).to.eql('value1');

          clock.advanceBy({ hours: 1, milliseconds: 1 });
          expect(await scopedKvStore.get('key1')).to.eql(undefined);
        }),
      );
    });
  });
}
