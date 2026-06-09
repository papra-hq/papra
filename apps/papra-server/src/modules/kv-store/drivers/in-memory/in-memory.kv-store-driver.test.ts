import { describe, expect, test, vi } from 'vitest';
import { createTestClock } from '../../../shared/clock/clock.test-utils';
import { runKvStoreDriverTestSuite } from '../kv-store-drivers.test-suite';
import { createInMemoryKvStoreDriver } from './in-memory.kv-store-driver';

describe('in-memory.kv-store-driver', () => {
  describe('createInMemoryKvStoreDriver', () => {
    runKvStoreDriverTestSuite(async ({ clock }) => ({
      driver: createInMemoryKvStoreDriver({ clock }),
    }));

    test('if the event loop is delayed/blocked (or timers are paused), expired keys are properly removed', async () => {
      const { clock } = createTestClock();
      const driver = createInMemoryKvStoreDriver({ clock });

      await driver.set({
        key: 'key1',
        value: 'value1',
        expiresAt: clock.now().add({ milliseconds: 1_000 }),
      });
      expect(await driver.get({ key: 'key1' })).to.eql('value1');

      vi.clearAllTimers(); // Remove the pending timeout that would have auto cleared the key after 1 second
      clock.advanceBy({ milliseconds: 1_001 });
      expect(await driver.get({ key: 'key1' })).to.eql(undefined);
    });
  });
});
