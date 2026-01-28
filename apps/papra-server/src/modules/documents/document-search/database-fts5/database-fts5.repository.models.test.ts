import type { SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { makeSearchWhereClause } from './database-fts5.repository.models';

describe('database-fts5 repository models', () => {
  describe('makeSearchWhereClause', async () => {
    const { db } = await createInMemoryDatabase();

    const sqliteDialect = new SQLiteSyncDialect();
    const getSqlString = (query?: SQL) => {
      if (!query) {
        return { sql: '', params: [] };
      }

      const { sql, params } = sqliteDialect.sqlToQuery(query);
      return { sql, params };
    };

    test('a simple text query', () => {
      const { issues, searchWhereClause } = makeSearchWhereClause({ organizationId: 'org_1', query: 'foo', db });

      expect(issues).to.eql([]);
      expect(getSqlString(searchWhereClause)).to.eql({
        sql: `(\"documents\".\"organization_id\" = ? and \"documents\".\"is_deleted\" = ? and \"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?))`,
        params: [
          'org_1',
          0,
          'organization_id:"org_1" {name content}:"foo"*',
        ],
      });
    });

    test('a complex query', () => {
      const { issues, searchWhereClause } = makeSearchWhereClause({
        organizationId: 'org_1',
        query: '(tag:important OR tag:urgent) AND NOT confidential',
        db,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(searchWhereClause)).to.eql({
        sql: '("documents"."organization_id" = ? and "documents"."is_deleted" = ? and (("documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."normalized_name" = ?)) or "documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."normalized_name" = ?))) and not "documents"."id" in (select distinct "document_id" from "documents_fts" where "documents_fts" = ?)))',
        params: [
          'org_1',
          0,
          'org_1',
          'important',
          'org_1',
          'urgent',
          'organization_id:\"org_1\" {name content}:\"confidential\"*',
        ],
      });
    });
  });
});
