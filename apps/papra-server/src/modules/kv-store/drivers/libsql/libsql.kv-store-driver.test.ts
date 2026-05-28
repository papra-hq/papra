import { describe, expect, test, vi } from 'vitest';
import { kvStoreMigration } from '../../../../migrations/list/0020-kv-store.migration';
import { setupDatabase } from '../../../app/database/database';
import { runKvStoreDriverTestSuite } from '../kv-store-drivers.test-suite';
import { createLibsqlKvStoreDriver } from './libsql.kv-store-driver';

async function createDriver() {
  const { db } = setupDatabase({ url: ':memory:' });
  await kvStoreMigration.up({ db });

  return { driver: createLibsqlKvStoreDriver({ db }) };
}

describe('libsql.kv-store-driver', () => {
  describe('createLibsqlKvStoreDriver', () => {
    runKvStoreDriverTestSuite(createDriver);

    describe('deleteExpired', () => {
      test('removes only entries whose ttl has elapsed and returns how many were deleted', async () => {
        vi.useFakeTimers();

        const { driver } = await createDriver();

        await driver.set('expired-1', 'value', { ttlMs: 1_000 });
        await driver.set('expired-2', 'value', { ttlMs: 1_000 });
        await driver.set('still-valid', 'value', { ttlMs: 10_000 });
        await driver.set('no-ttl', 'value');

        vi.advanceTimersByTime(1_001);

        expect(await driver.deleteExpired!()).to.eql({ deletedCount: 2 });

        // A second run finds nothing left to purge.
        expect(await driver.deleteExpired!()).to.eql({ deletedCount: 0 });

        expect(await driver.get('expired-1')).to.eql(undefined);
        expect(await driver.get('expired-2')).to.eql(undefined);
        expect(await driver.get('still-valid')).to.eql('value');
        expect(await driver.get('no-ttl')).to.eql('value');

        vi.useRealTimers();
      });
    });
  });
});
