import type { SQL } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { stringifySqlQuery } from '../../../app/database/database.models';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { makeSearchOrderByClauses, makeSearchWhereClause } from './database-fts5.repository.models';

describe('database-fts5 repository models', () => {
  describe('makeSearchWhereClause', async () => {
    const { db } = await createInMemoryDatabase();

    test('a simple text query', () => {
      const { issues, searchWhereClause } = makeSearchWhereClause({
        organizationId: 'org_1',
        query: 'foo',
        db,
      });

      expect(issues).to.eql([]);
      expect(stringifySqlQuery(searchWhereClause)).to.eql({
        query: `("documents"."organization_id" = ? and "documents"."is_deleted" = ? and "documents"."id" in (select distinct "document_id" from "documents_fts" where "documents_fts" = ?))`,
        params: ['org_1', 0, 'organization_id:"org_1" {name content}:"foo"*'],
      });
    });

    test('a complex query', () => {
      const { issues, searchWhereClause } = makeSearchWhereClause({
        organizationId: 'org_1',
        query: '(tag:important OR tag:urgent) AND NOT confidential',
        db,
      });

      expect(issues).to.eql([]);
      expect(stringifySqlQuery(searchWhereClause)).to.eql({
        query:
          '("documents"."organization_id" = ? and "documents"."is_deleted" = ? and (("documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."normalized_name" = ?)) or "documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."normalized_name" = ?))) and not "documents"."id" in (select distinct "document_id" from "documents_fts" where "documents_fts" = ?)))',
        params: [
          'org_1',
          0,
          'org_1',
          'important',
          'org_1',
          'urgent',
          'organization_id:"org_1" {name content}:"confidential"*',
        ],
      });
    });
  });

  describe('makeSearchOrderByClauses', () => {
    const toOrderByClause = ({ orderByClauses }: { orderByClauses: SQL[] }) =>
      orderByClauses
        .map((clause) => stringifySqlQuery(clause))
        .map(({ query }) => query)
        .join(', ');

    test('sort by createdAt', () => {
      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'createdAt', order: 'asc' } })),
      ).to.eql('"documents"."created_at" asc, "documents"."id" asc');

      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'createdAt', order: 'desc' } })),
      ).to.eql('"documents"."created_at" desc, "documents"."id" desc');
    });

    test('sort by name, the name is sorted case-insensitively, with createdAt as fallback', () => {
      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'name', order: 'desc' } })),
      ).to.eql(
        '"documents"."name" COLLATE NOCASE desc, "documents"."created_at" desc, "documents"."id" desc',
      );

      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'name', order: 'asc' } })),
      ).to.eql(
        '"documents"."name" COLLATE NOCASE asc, "documents"."created_at" asc, "documents"."id" asc',
      );
    });

    test('sort by documentDate asc, with createdAt as fallback', () => {
      expect(
        toOrderByClause(
          makeSearchOrderByClauses({ sort: { field: 'documentDate', order: 'asc' } }),
        ),
      ).to.eql(
        '"documents"."document_date" asc, "documents"."created_at" asc, "documents"."id" asc',
      );

      expect(
        toOrderByClause(
          makeSearchOrderByClauses({ sort: { field: 'documentDate', order: 'desc' } }),
        ),
      ).to.eql(
        '"documents"."document_date" desc, "documents"."created_at" desc, "documents"."id" desc',
      );
    });

    test('sort by updatedAt desc, with createdAt as fallback', () => {
      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'updatedAt', order: 'desc' } })),
      ).to.eql(
        '"documents"."updated_at" desc, "documents"."created_at" desc, "documents"."id" desc',
      );

      expect(
        toOrderByClause(makeSearchOrderByClauses({ sort: { field: 'updatedAt', order: 'asc' } })),
      ).to.eql('"documents"."updated_at" asc, "documents"."created_at" asc, "documents"."id" asc');
    });
  });
});
