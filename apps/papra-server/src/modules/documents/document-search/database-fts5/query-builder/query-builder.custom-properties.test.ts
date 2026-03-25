import type { SQL } from 'drizzle-orm';
import type { CustomPropertyDefinition } from './query-builder.custom-properties';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../../app/database/database.test-utils';
import { handleCustomPropertyFilter, handleHasCustomPropertyFilter } from './query-builder.custom-properties';

describe('query-builder - custom properties', async () => {
  const { db } = await createInMemoryDatabase();
  const sqliteDialect = new SQLiteSyncDialect();
  const now = new Date('2025-06-15');

  const getSqlString = (query?: SQL) => {
    if (!query) {
      return { sql: '', params: [] };
    }

    const { sql, params } = sqliteDialect.sqlToQuery(query);

    return { sql, params };
  };

  function makeDefinition(overrides: Partial<CustomPropertyDefinition> = {}): CustomPropertyDefinition {
    return {
      id: 'cpd_1',
      organizationId: 'org_1',
      name: 'Warranty',
      key: 'warranty',
      description: null,
      type: 'boolean',
      config: null,
      displayOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  describe('boolean property filter', () => {
    test('warranty:true builds a subquery matching booleanValue = 1', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'warranty', operator: '=', value: 'true' },
        definition: makeDefinition({ type: 'boolean' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."boolean_value" = ?))`,
        params: ['cpd_1', 1],
      });
    });

    test('warranty:false builds a subquery matching booleanValue = 0', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'warranty', operator: '=', value: 'false' },
        definition: makeDefinition({ type: 'boolean' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."boolean_value" = ?))`,
        params: ['cpd_1', 0],
      });
    });

    test.each([
      ['yes', 1],
      ['y', 1],
      ['1', 1],
      ['on', 1],
      ['enabled', 1],
      ['YES', 1],
      ['TRUE', 1],
      ['no', 0],
      ['n', 0],
      ['0', 0],
      ['off', 0],
      ['disabled', 0],
      ['NO', 0],
      ['FALSE', 0],
    ])('warranty:%s is accepted as a valid boolean value', (value, expected) => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'warranty', operator: '=', value },
        definition: makeDefinition({ type: 'boolean' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery).params[1]).to.equal(expected);
    });

    test('warranty:maybe returns an INVALID_BOOLEAN_VALUE issue and a no-match query', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'warranty', operator: '=', value: 'maybe' },
        definition: makeDefinition({ type: 'boolean' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Invalid boolean value "maybe" for warranty filter. Expected one of: true, yes, y, 1, on, enabled, false, no, n, 0, off, disabled',
        code: 'INVALID_BOOLEAN_VALUE',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });

    test('warranty:>true returns an UNSUPPORTED_FILTER_OPERATOR issue for non-equality operators', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'warranty', operator: '>', value: 'true' },
        definition: makeDefinition({ type: 'boolean' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for warranty filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('text property filter', () => {
    test('category:invoice builds an exact-match subquery on textValue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'category', operator: '=', value: 'invoice' },
        definition: makeDefinition({ id: 'cpd_2', type: 'text', key: 'category' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."text_value" = ?))`,
        params: ['cpd_2', 'invoice'],
      });
    });

    test('category:>invoice returns an UNSUPPORTED_FILTER_OPERATOR issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'category', operator: '>', value: 'invoice' },
        definition: makeDefinition({ id: 'cpd_2', type: 'text', key: 'category' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for category filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('number property filter', () => {
    test('amount:100 builds an equality subquery on numberValue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '=', value: '100' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."number_value" = ?))`,
        params: ['cpd_3', 100],
      });
    });

    test('amount:>100 uses the greater-than operator', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '>', value: '100' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."number_value" > ?))`,
        params: ['cpd_3', 100],
      });
    });

    test('amount:>=100 uses the greater-than-or-equal operator', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '>=', value: '100' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."number_value" >= ?))`,
        params: ['cpd_3', 100],
      });
    });

    test('amount:<100 uses the less-than operator', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '<', value: '100' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."number_value" < ?))`,
        params: ['cpd_3', 100],
      });
    });

    test('amount:<=100 uses the less-than-or-equal operator', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '<=', value: '100' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."number_value" <= ?))`,
        params: ['cpd_3', 100],
      });
    });

    test('amount:notanumber returns an INVALID_NUMBER_VALUE issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'amount', operator: '=', value: 'notanumber' },
        definition: makeDefinition({ id: 'cpd_3', type: 'number', key: 'amount' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Invalid number value "notanumber" for amount filter. Expected a numeric value.',
        code: 'INVALID_NUMBER_VALUE',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('date property filter', () => {
    test('expiry:2025-01-01 builds an equality subquery on dateValue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'expiry', operator: '=', value: '2025-01-01' },
        definition: makeDefinition({ id: 'cpd_4', type: 'date', key: 'expiry' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."date_value" = ?))`,
        params: ['cpd_4', 1735689600000],
      });
    });

    test('expiry:>2025-01-01 uses the greater-than operator', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'expiry', operator: '>', value: '2025-01-01' },
        definition: makeDefinition({ id: 'cpd_4', type: 'date', key: 'expiry' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."date_value" > ?))`,
        params: ['cpd_4', 1735689600000],
      });
    });

    test('expiry:now uses the current timestamp', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'expiry', operator: '=', value: 'now' },
        definition: makeDefinition({ id: 'cpd_4', type: 'date', key: 'expiry' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."date_value" = ?))`,
        params: ['cpd_4', now.getTime()],
      });
    });

    test('expiry:not-a-date returns an INVALID_DATE_FORMAT issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'expiry', operator: '=', value: 'not-a-date' },
        definition: makeDefinition({ id: 'cpd_4', type: 'date', key: 'expiry' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Invalid date format for expiry filter: "not-a-date". Expected a valid date string.',
        code: 'INVALID_DATE_FORMAT',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('select property filter', () => {
    test('status:approved builds a subquery joining select options by key', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'status', operator: '=', value: 'approved' },
        definition: makeDefinition({ id: 'cpd_5', type: 'select', key: 'status' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_custom_property_values"."document_id" from "document_custom_property_values" inner join "custom_property_select_options" on "document_custom_property_values"."select_option_id" = "custom_property_select_options"."id" where ("document_custom_property_values"."property_definition_id" = ? and "custom_property_select_options"."key" = ?))`,
        params: ['cpd_5', 'approved'],
      });
    });

    test('status:>approved returns an UNSUPPORTED_FILTER_OPERATOR issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'status', operator: '>', value: 'approved' },
        definition: makeDefinition({ id: 'cpd_5', type: 'select', key: 'status' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for status filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('multi_select property filter', () => {
    test('labels:urgent builds a subquery joining select options by key (same as select)', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'labels', operator: '=', value: 'urgent' },
        definition: makeDefinition({ id: 'cpd_6', type: 'multi_select', key: 'labels' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_custom_property_values"."document_id" from "document_custom_property_values" inner join "custom_property_select_options" on "document_custom_property_values"."select_option_id" = "custom_property_select_options"."id" where ("document_custom_property_values"."property_definition_id" = ? and "custom_property_select_options"."key" = ?))`,
        params: ['cpd_6', 'urgent'],
      });
    });
  });

  describe('user_relation property filter', () => {
    test('assignee:usr_1 builds a subquery matching userId directly', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'assignee', operator: '=', value: 'usr_1' },
        definition: makeDefinition({ id: 'cpd_7', type: 'user_relation', key: 'assignee' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_custom_property_values"."document_id" from "document_custom_property_values" left join "users" on "document_custom_property_values"."user_id" = "users"."id" where ("document_custom_property_values"."property_definition_id" = ? and ("document_custom_property_values"."user_id" = ? or "users"."email" = ? or "users"."name" = ?)))`,
        params: ['cpd_7', 'usr_1', 'usr_1', 'usr_1'],
      });
    });

    test('assignee:user@example.com builds a subquery matching by email via left join', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'assignee', operator: '=', value: 'user@example.com' },
        definition: makeDefinition({ id: 'cpd_7', type: 'user_relation', key: 'assignee' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_custom_property_values"."document_id" from "document_custom_property_values" left join "users" on "document_custom_property_values"."user_id" = "users"."id" where ("document_custom_property_values"."property_definition_id" = ? and ("document_custom_property_values"."user_id" = ? or "users"."email" = ? or "users"."name" = ?)))`,
        params: ['cpd_7', 'user@example.com', 'user@example.com', 'user@example.com'],
      });
    });

    test('assignee:>usr_1 returns an UNSUPPORTED_FILTER_OPERATOR issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'assignee', operator: '>', value: 'usr_1' },
        definition: makeDefinition({ id: 'cpd_7', type: 'user_relation', key: 'assignee' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for assignee filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('document_relation property filter', () => {
    test('related:doc_1 builds a subquery matching relatedDocumentId directly', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'related', operator: '=', value: 'doc_1' },
        definition: makeDefinition({ id: 'cpd_8', type: 'document_relation', key: 'related' }),
        db,
        now,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."related_document_id" = ?))`,
        params: ['cpd_8', 'doc_1'],
      });
    });

    test('related:>doc_1 returns an UNSUPPORTED_FILTER_OPERATOR issue', () => {
      const { sqlQuery, issues } = handleCustomPropertyFilter({
        expression: { type: 'filter', field: 'related', operator: '>', value: 'doc_1' },
        definition: makeDefinition({ id: 'cpd_8', type: 'document_relation', key: 'related' }),
        db,
        now,
      });

      expect(issues).to.eql([{
        message: 'Unsupported operator ">" for related filter',
        code: 'UNSUPPORTED_FILTER_OPERATOR',
      }]);
      expect(getSqlString(sqlQuery)).to.eql({ sql: '0', params: [] });
    });
  });

  describe('has custom property filter', () => {
    test('has:warranty builds a subquery checking for any row with that property definition id', () => {
      const { sqlQuery, issues } = handleHasCustomPropertyFilter({
        definition: makeDefinition({ id: 'cpd_1', type: 'boolean', key: 'warranty' }),
        db,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."boolean_value" is not null))`,
        params: ['cpd_1'],
      });
    });

    test('works for any property type — text example', () => {
      const { sqlQuery, issues } = handleHasCustomPropertyFilter({
        definition: makeDefinition({ id: 'cpd_2', type: 'text', key: 'category' }),
        db,
      });

      expect(issues).to.eql([]);
      expect(getSqlString(sqlQuery)).to.eql({
        sql: `"documents"."id" in (select "document_id" from "document_custom_property_values" where ("document_custom_property_values"."property_definition_id" = ? and "document_custom_property_values"."text_value" is not null))`,
        params: ['cpd_2'],
      });
    });
  });
});
