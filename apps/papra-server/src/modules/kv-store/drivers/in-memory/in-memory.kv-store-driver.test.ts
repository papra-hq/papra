import { describe, expect, test, vi } from 'vitest';
import { runKvStoreDriverTestSuite } from '../kv-store-drivers.test-suite';
import { createInMemoryKvStoreDriver } from './in-memory.kv-store-driver';

describe('in-memory.kv-store-driver', () => {
  describe('createInMemoryKvStoreDriver', () => {
    runKvStoreDriverTestSuite(async () => ({ driver: createInMemoryKvStoreDriver() }));

    test('if the event loop is delayed/blocked (or timers are paused), expired keys are properly removed', async () => {
      const driver = createInMemoryKvStoreDriver();

      vi.useFakeTimers();

      await driver.set('key1', 'value1', { ttlMs: 1000 });
      expect(await driver.get('key1')).to.eql('value1');

      vi.clearAllTimers(); // Remove the pending timeout that would have cleared the key after 1 second
      vi.advanceTimersByTime(1_001);

      // The expired key should have been removed and not be returned anymore
      expect(await driver.get('key1')).to.eql(undefined);

      vi.useRealTimers();
    });
  });
});
