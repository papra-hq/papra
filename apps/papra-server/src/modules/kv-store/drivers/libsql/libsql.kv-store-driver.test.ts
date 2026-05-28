import { describe } from 'vitest';
import { kvStoreMigration } from '../../../../migrations/list/0020-kv-store.migration';
import { setupDatabase } from '../../../app/database/database';
import { runKvStoreDriverTestSuite } from '../kv-store-drivers.test-suite';
import { createLibsqlKvStoreDriver } from './libsql.kv-store-driver';

describe('libsql.kv-store-driver', () => {
  describe('createLibsqlKvStoreDriver', () => {
    runKvStoreDriverTestSuite(async () => {
      const { db } = setupDatabase({ url: ':memory:' });
      await kvStoreMigration.up({ db });

      return { driver: createLibsqlKvStoreDriver({ db }) };
    });
  });
});
