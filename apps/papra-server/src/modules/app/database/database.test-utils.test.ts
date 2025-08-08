import { sql } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from './database';
import { serializeSchema } from './database.test-utils';

describe('database-utils test', () => {
  describe('serializeSchema', () => {
    test('given a database with some tables, it should return the schema as a string, used for db state snapshot', async () => {
      const { db } = setupDatabase({ url: ':memory:' });
      await db.run(sql`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`);
      await db.run(sql`CREATE INDEX idx_test_name ON test (name)`);
      await db.run(sql`CREATE VIEW test_view AS SELECT * FROM test`);
      await db.run(sql`CREATE TRIGGER test_trigger AFTER INSERT ON test BEGIN SELECT 1; END`);

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
