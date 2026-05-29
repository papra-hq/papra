import type { Clock } from '../../../shared/clock/clock.types';
import { describe, expect, test } from 'vitest';
import { kvStoreMigration } from '../../../../migrations/list/0020-kv-store.migration';
import { setupDatabase } from '../../../app/database/database';
import { createTestClock } from '../../../shared/clock/clock.test-utils';
import { runKvStoreDriverTestSuite } from '../kv-store-drivers.test-suite';
import { createLibsqlKvStoreDriver } from './libsql.kv-store-driver';

async function createDriver({ clock }: { clock?: Clock } = {}) {
  const { db } = setupDatabase({ url: ':memory:' });
  await kvStoreMigration.up({ db });

  return { driver: createLibsqlKvStoreDriver({ db, clock }) };
}

describe('libsql.kv-store-driver', () => {
  describe('createLibsqlKvStoreDriver', () => {
    runKvStoreDriverTestSuite(createDriver);

    describe('deleteExpired', () => {
      test('removes only entries whose expiry has elapsed and returns how many were deleted', async () => {
        const { clock } = createTestClock();
        const { driver } = await createDriver({ clock });

        await driver.set({ key: 'expired-1', value: 'value', expiresAt: clock.now().add({ milliseconds: 1_000 }) });
        await driver.set({ key: 'expired-2', value: 'value', expiresAt: clock.now().add({ milliseconds: 1_000 }) });
        await driver.set({ key: 'still-valid', value: 'value', expiresAt: clock.now().add({ milliseconds: 10_000 }) });
        await driver.set({ key: 'no-expiry', value: 'value' });

        clock.advanceBy({ milliseconds: 1_001 });

        expect(await driver.deleteExpired!()).to.eql({ deletedCount: 2 });

        // A second run finds nothing left to purge.
        expect(await driver.deleteExpired!()).to.eql({ deletedCount: 0 });

        expect(await driver.get({ key: 'expired-1' })).to.eql(undefined);
        expect(await driver.get({ key: 'expired-2' })).to.eql(undefined);
        expect(await driver.get({ key: 'still-valid' })).to.eql('value');
        expect(await driver.get({ key: 'no-expiry' })).to.eql('value');
      });
    });
  });
});
