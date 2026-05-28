import * as v from 'valibot';
import { describe, expect, test, vi } from 'vitest';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createInMemoryKvStoreDriver } from './drivers/in-memory/in-memory.kv-store-driver';
import { createKvStore } from './kv-store';

function setup() {
  const { logger, getLogs } = createTestLogger({ namespace: 'kv-store' });
  const driver = createInMemoryKvStoreDriver();
  const kvStore = createKvStore({ driver, logger });

  return { driver, kvStore, getLogs };
}

describe('kv-store', () => {
  describe('defineScope', () => {
    describe('prefix isolation', () => {
      test('scopes with different prefixes do not collide on the same key', async () => {
        const { kvStore } = setup();

        const scopeA = kvStore.defineScope({ prefix: 'a', schema: v.string() });
        const scopeB = kvStore.defineScope({ prefix: 'b', schema: v.string() });

        await scopeA.set('shared-key', 'from-a');
        await scopeB.set('shared-key', 'from-b');

        expect(await scopeA.get('shared-key')).to.eql('from-a');
        expect(await scopeB.get('shared-key')).to.eql('from-b');
      });

      test('deleting a key in one scope does not affect another scope', async () => {
        const { kvStore } = setup();

        const scopeA = kvStore.defineScope({ prefix: 'a', schema: v.string() });
        const scopeB = kvStore.defineScope({ prefix: 'b', schema: v.string() });

        await scopeA.set('key', 'from-a');
        await scopeB.set('key', 'from-b');

        await scopeA.delete('key');

        expect(await scopeA.get('key')).to.eql(undefined);
        expect(await scopeB.get('key')).to.eql('from-b');
      });
    });

    describe('schema validation on get', () => {
      test('an entry that no longer matches the schema is dropped, logged and removed from storage', async () => {
        const { kvStore, driver, getLogs } = setup();

        // Write a string then read it back through a scope that expects a number — simulates a shape drift between deploys.
        const writeScope = kvStore.defineScope({ prefix: 'shape', schema: v.string() });
        const readScope = kvStore.defineScope({ prefix: 'shape', schema: v.number() });

        await writeScope.set('key', 'not-a-number');

        expect(await readScope.get('key')).to.eql(undefined);

        // Underlying entry was actually deleted, not just hidden by the parse failure.
        expect(await driver.get('shape:key')).to.eql(undefined);

        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs).to.have.length(1);
        expect(logs[0]).to.deep.include({
          level: 'warn',
          message: 'Dropping kv entry that fails schema validation',
          namespace: 'kv-store',
        });
      });
    });

    describe('schema validation on set', () => {
      test('setting an invalid value throws the InvalidKvStoreValue error and logs the issues', async () => {
        const { kvStore, driver, getLogs } = setup();

        const scope = kvStore.defineScope({ prefix: 'shape', schema: v.string() });

        await expect(scope.set('key', 42 as unknown as string)).rejects.toMatchObject({
          code: 'kv_store.invalid_value',
        });

        expect(await driver.get('shape:key')).to.eql(undefined);

        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs).to.have.length(1);
        expect(logs[0]).to.deep.include({
          level: 'error',
          message: 'Failed to set kv entry because value fails schema validation',
          namespace: 'kv-store',
        });
      });
    });

    describe('defaultTtlMs', () => {
      test('the scope default TTL applies when no per-call TTL is given', async () => {
        vi.useFakeTimers();
        const { kvStore } = setup();

        const scope = kvStore.defineScope({ prefix: 'ttl', schema: v.string(), defaultTtlMs: 1_000 });

        await scope.set('key', 'value');
        expect(await scope.get('key')).to.eql('value');

        vi.advanceTimersByTime(1_001);

        expect(await scope.get('key')).to.eql(undefined);

        vi.useRealTimers();
      });

      test('a per-call TTL overrides the scope default TTL', async () => {
        vi.useFakeTimers();
        const { kvStore } = setup();

        const scope = kvStore.defineScope({ prefix: 'ttl', schema: v.string(), defaultTtlMs: 10_000 });

        await scope.set('key', 'value', { ttlMs: 500 });

        vi.advanceTimersByTime(501);

        expect(await scope.get('key')).to.eql(undefined);

        vi.useRealTimers();
      });
    });
  });
});
