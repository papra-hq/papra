import type { SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../../app/database/database.test-utils';
import {
  handleAndExpression,
  handleContentFilter,
  handleCreatedFilter,
  handleEmptyExpression,
  handleHasTagsFilter,
  handleNameFilter,
  handleNotExpression,
  handleOrExpression,
  handleTagFilter,
  handleTextExpression,
  handleUnsupportedExpression,
} from './query-builder';

describe('query-builder', async () => {
  const { db } = await createInMemoryDatabase();
  const sqliteDialect = new SQLiteSyncDialect();
  const getSqlString = (query?: SQL) => {
    if (!query) {
      return { sql: '', params: [] };
    }

    const { sql, params } = sqliteDialect.sqlToQuery(query);
    return { sql, params };
  };

  describe('handleNameFilter', () => {
    test('builds a fts5 scoped on organization id and name column', () => {
      const { sqlQuery, issues } = handleNameFilter({
        expression: { type: 'filter', field: 'name', value: 'important', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {name}:"important"*'],
      });
    });

    test('builds a fts5 scoped on organization id and name column with special characters escaped', () => {
      const { sqlQuery, issues } = handleNameFilter({
        expression: { type: 'filter', field: 'name', value: 'important (draft)', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {name}:"important (draft)"*'],
      });
    });

    test('just the equality operator is supported ("=") for name filters, other operators return an issue and a no-op SQL query that evaluates to false', () => {
      const { sqlQuery, issues } = handleNameFilter({
        expression: { type: 'filter', field: 'name', value: 'important', operator: '>' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for name filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({ sql: `0`, params: [] });
    });
  });

  describe('handleContentFilter', () => {
    test('builds a fts5 scoped on organization id and content column', () => {
      const { sqlQuery, issues } = handleContentFilter({
        expression: { type: 'filter', field: 'content', value: 'confidential', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {content}:"confidential"*'],
      });
    });

    test('builds a fts5 scoped on organization id and content column with special characters escaped', () => {
      const { sqlQuery, issues } = handleContentFilter({
        expression: { type: 'filter', field: 'content', value: 'confidential [v2]', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {content}:"confidential [v2]"*'],
      });
    });

    test('just the equality operator is supported ("=") for content filters, other operators return an issue and a no-op SQL query that evaluates to false', () => {
      const { sqlQuery, issues } = handleContentFilter({
        expression: { type: 'filter', field: 'content', value: 'confidential', operator: '<' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator "<" for content filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({ sql: `0`, params: [] });
    });
  });

  describe('handleCreatedFilter', () => {
    test('supports equality operator for date filtering', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: '2024-01-15', operator: '=' },
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"created_at\" = ?`,
        params: [1705276800000],
      });
    });

    test('supports greater than operator for date filtering', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: '2024-01-15', operator: '>' },
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"created_at\" > ?`,
        params: [1705276800000],
      });
    });

    test('supports greater than or equal operator for date filtering', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: '2024-01-15', operator: '>=' },
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"created_at\" >= ?`,
        params: [1705276800000],
      });
    });

    test('supports less than operator for date filtering', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: '2024-01-15', operator: '<' },
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"created_at\" < ?`,
        params: [1705276800000],
      });
    });

    test('supports less than or equal operator for date filtering', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: '2024-01-15', operator: '<=' },
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"created_at\" <= ?`,
        params: [1705276800000],
      });
    });

    test('returns an error for invalid date format', () => {
      const { sqlQuery, issues } = handleCreatedFilter({
        expression: { type: 'filter', field: 'created', value: 'not-a-date', operator: '=' },
      });

      expect(issues).to.eql([{
        message: 'Invalid date format "not-a-date" for created filter',
        code: 'INVALID_DATE_FORMAT',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({ sql: `0`, params: [] });
    });

    test('accepts various ISO date formats', () => {
      const dateFormats = {
        '2024': 1704067200000,
        '2024-01': 1704067200000,
        '2024-01-15': 1705276800000,
        '2024-01-15T00:00:00Z': 1705276800000,
        '2024-01-15T00:00:00.000Z': 1705276800000,
        '2024-01-15T02:00:00+02:00': 1705276800000,
        '2024/01/15': 1705276800000,
        '2024/01/15 00:00:00': 1705276800000,
        '2024.01.15': 1705276800000,
        '2024,01,15': 1705276800000,
        '2024 01 15': 1705276800000,
        'January 15, 2024': 1705276800000,
        'Jan 15 2024': 1705276800000,
        '15 January 2024': 1705276800000,
        '15 Jan 2024': 1705276800000,
      };

      for (const [dateFormat, timestamp] of Object.entries(dateFormats)) {
        const { sqlQuery, issues } = handleCreatedFilter({
          expression: { type: 'filter', field: 'created', value: dateFormat, operator: '=' },
        });

        expect(issues).to.eql([]);
        expect(getSqlString(sqlQuery)).to.eql({
          sql: `\"documents\".\"created_at\" = ?`,
          params: [timestamp],
        });
      }
    });
  });

  describe('handleEmptyExpression', () => {
    test('when the expression is empty, it returns a no-op SQL query that always evaluates to true', () => {
      const { sqlQuery, issues } = handleEmptyExpression();

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `1`,
        params: [],
      });
    });
  });

  describe('handleTextExpression', () => {
    test('builds a fts5 query matching both name and content columns scoped on organization id', () => {
      const { sqlQuery, issues } = handleTextExpression({
        expression: { type: 'text', value: 'budget report' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {name content}:"budget report"*'],
      });
    });

    test('handles special characters in text expression (quotes are stripped by the formatter)', () => {
      const { sqlQuery, issues } = handleTextExpression({
        expression: { type: 'text', value: 'Q3 (final)' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {name content}:"Q3 (final)"*'],
      });
    });
  });

  describe('handleAndExpression', () => {
    test('combines multiple expressions with AND logic', () => {
      const { sqlQuery, issues } = handleAndExpression({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'invoice' },
            { type: 'filter', field: 'name', value: 'Q3', operator: '=' },
          ],
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `(\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?) and \"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?))`,
        params: [
          'organization_id:"org_1" {name content}:"invoice"*',
          'organization_id:"org_1" {name}:"Q3"*',
        ],
      });
    });

    test('collects issues from all sub-expressions when combining with AND', () => {
      const { sqlQuery, issues } = handleAndExpression({
        expression: {
          type: 'and',
          operands: [
            { type: 'filter', field: 'name', value: 'important', operator: '>' },
            { type: 'filter', field: 'content', value: 'secret', operator: '<' },
          ],
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([
        {
          message: 'Unsupported operator ">" for name filter',
          code: 'UNSUPPORTED_FILTER_OPERATOR',
        },
        {
          message: 'Unsupported operator "<" for content filter',
          code: 'UNSUPPORTED_FILTER_OPERATOR',
        },
      ]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `(0 and 0)`,
        params: [],
      });
    });
  });

  describe('handleOrExpression', () => {
    test('combines multiple expressions with OR logic', () => {
      const { sqlQuery, issues } = handleOrExpression({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'invoice' },
            { type: 'text', value: 'receipt' },
          ],
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `(\"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?) or \"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?))`,
        params: [
          'organization_id:"org_1" {name content}:"invoice"*',
          'organization_id:"org_1" {name content}:"receipt"*',
        ],
      });
    });

    test('collects issues from all sub-expressions when combining with OR', () => {
      const { sqlQuery, issues } = handleOrExpression({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'name', value: 'test', operator: '>' },
            { type: 'filter', field: 'content', value: 'data', operator: '>=' },
          ],
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([
        {
          message: 'Unsupported operator ">" for name filter',
          code: 'UNSUPPORTED_FILTER_OPERATOR',
        },
        {
          message: 'Unsupported operator ">=" for content filter',
          code: 'UNSUPPORTED_FILTER_OPERATOR',
        },
      ]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `(0 or 0)`,
        params: [],
      });
    });
  });

  describe('handleNotExpression', () => {
    test('inverts a valid expression with NOT logic', () => {
      const { sqlQuery, issues } = handleNotExpression({
        expression: {
          type: 'not',
          operand: { type: 'text', value: 'spam' },
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `not \"documents\".\"id\" in (select distinct \"document_id\" from \"documents_fts\" where \"documents_fts\" = ?)`,
        params: ['organization_id:"org_1" {name content}:"spam"*'],
      });
    });

    test('does not treat empty operand as error because empty always matches truthy in sql', () => {
      const { sqlQuery, issues } = handleNotExpression({
        expression: {
          type: 'not',
          operand: { type: 'empty' },
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `not 1`,
        params: [],
      });
    });

    test('propagates issues from nested expression when negating', () => {
      const { sqlQuery, issues } = handleNotExpression({
        expression: {
          type: 'not',
          operand: { type: 'filter', field: 'name', value: 'test', operator: '<' },
        },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator "<" for name filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `not 0`,
        params: [],
      });
    });
  });

  describe('handleHasTagsFilter', () => {
    test('builds query to find documents with tags', () => {
      const { sqlQuery, issues } = handleHasTagsFilter({
        expression: { type: 'filter', field: 'has', value: 'tags', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where "tags"."organization_id" = ?)`,
        params: ['org_1'],
      });
    });

    test('just the equality operator is supported ("=") for has filters, other operators return an issue and a no-op SQL query that evaluates to false', () => {
      const { sqlQuery, issues } = handleHasTagsFilter({
        expression: { type: 'filter', field: 'has', value: 'tags', operator: '>' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for has filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({ sql: `0`, params: [] });
    });
  });

  describe('handleUnsupportedExpression', () => {
    test('returns error for unsupported expression types', () => {
      const { sqlQuery, issues } = handleUnsupportedExpression();

      expect(issues).to.eql([{
        message: 'Unsupported expression type',
        code: 'UNSUPPORTED_EXPRESSION_TYPE',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: `0`, params: [] });
    });

    test('returns a no-op SQL query that always evaluates to false', () => {
      const { sqlQuery, issues } = handleUnsupportedExpression();

      expect(issues).to.eql([{
        message: 'Unsupported expression type',
        code: 'UNSUPPORTED_EXPRESSION_TYPE',
      }]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: `0`,
        params: [],
      });
    });
  });

  describe('handleTagFilter', () => {
    test('when the tag filter value is a proper tag id, the built query matches by id', () => {
      const { sqlQuery, issues } = handleTagFilter({
        expression: { type: 'filter', field: 'tag', value: 'tag_123456789123456789123456', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: '"documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."id" = ?))',
        params: ['org_1', 'tag_123456789123456789123456'],
      });
    });

    test('when the tag filter value is not a proper tag id, the built query matches by name', () => {
      const { sqlQuery, issues } = handleTagFilter({
        expression: { type: 'filter', field: 'tag', value: 'Important THING', operator: '=' },
        organizationId: 'org_1',
        db,
      });

      expect(issues).to.eql([]);

      expect(getSqlString(sqlQuery)).to.eql({
        sql: '"documents"."id" in (select distinct "documents_tags"."document_id" from "documents_tags" inner join "tags" on "documents_tags"."tag_id" = "tags"."id" where ("tags"."organization_id" = ? and "tags"."normalized_name" = ?))',
        params: ['org_1', 'important thing'],
      });
    });
  });
});
