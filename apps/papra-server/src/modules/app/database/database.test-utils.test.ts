import { sql } from 'kysely';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from './database';
import { serializeSchema } from './database.test-utils';

describe('database-utils test', () => {
  describe('serializeSchema', () => {
    test('given a database with some tables, it should return the schema as a string, used for db state snapshot', async () => {
      const { db } = setupDatabase({ url: ':memory:' });
      await db.executeQuery(sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`.compile(db));
      await db.executeQuery(sql`CREATE INDEX idx_test_name ON test (name)`.compile(db));
      await db.executeQuery(sql`CREATE VIEW test_view AS SELECT * FROM test`.compile(db));
      await db.executeQuery(sql`CREATE TRIGGER test_trigger AFTER INSERT ON test BEGIN SELECT 1; END`.compile(db));

      const schema = await serializeSchema({ db });
      expect(schema).toMatchInlineSnapshot(`
        "CREATE INDEX idx_test_name ON test (name);
        CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TRIGGER test_trigger AFTER INSERT ON test BEGIN SELECT 1; END;
        CREATE VIEW test_view AS SELECT * FROM test;"
      `);
    });
  });
});
