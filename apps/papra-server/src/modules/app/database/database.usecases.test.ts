import { describe, expect, test } from 'vitest';
import { usersTable } from '../../users/users.table';
import { createInMemoryDatabase } from './database.test-utils';
import { createIterator } from './database.usecases';

const createUsers = ({ count }: { count: number }) => Array.from({ length: count }, (_, i) => ({ id: `usr_${i}`, email: `user-${i}@papra.dev` }));

describe('database usecases', () => {
  describe('createIterator', () => {
    test('permit to iterate over a large collection of records', async () => {
      const { db } = await createInMemoryDatabase({
        users: createUsers({ count: 10 }),
      });

      const query = db.select().from(usersTable).orderBy(usersTable.id).$dynamic();
      const iterator = createIterator({ query });

      const results: string[] = [];
      for await (const record of iterator) {
        results.push(record.id);
      }

      expect(results.length).to.eql(10);
      expect(results).to.eql(['usr_0', 'usr_1', 'usr_2', 'usr_3', 'usr_4', 'usr_5', 'usr_6', 'usr_7', 'usr_8', 'usr_9']);
    });

    test('it works with Array.fromAsync', async () => {
      const { db } = await createInMemoryDatabase({
        users: createUsers({ count: 10 }),
      });

      const query = db.select().from(usersTable).orderBy(usersTable.id).$dynamic();
      const iterator = createIterator({ query });

      const results = await Array.fromAsync(iterator);

      expect(results.length).to.eql(10);
    });

    test('the amount of records per page is configurable', async () => {
      const { db } = await createInMemoryDatabase({
        users: createUsers({ count: 10 }),
      });

      const query = db.select().from(usersTable).orderBy(usersTable.id).$dynamic();
      const iterator = createIterator({ query, batchSize: 3 });

      const results: string[] = [];
      for await (const record of iterator) {
        results.push(record.id);
      }

      expect(results.length).to.eql(10);
      expect(results).to.eql(['usr_0', 'usr_1', 'usr_2', 'usr_3', 'usr_4', 'usr_5', 'usr_6', 'usr_7', 'usr_8', 'usr_9']);
    });
  });
});
