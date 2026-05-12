import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { stringifySqlQuery } from './database.models';

describe('database.models', () => {
  describe('stringifySqlQuery', async () => {
    test('works with raw SQL query builder', () => {
      expect(
        stringifySqlQuery(sql`select name from users where id = ${'user_1'}`),
      ).to.eql({
        query: 'select name from users where id = ?',
        params: ['user_1'],
      });
    });

    test('no SQL query builder provided means empty query and params', () => {
      expect(stringifySqlQuery()).to.eql({
        query: '',
        params: [],
      });
    });
  });
});
