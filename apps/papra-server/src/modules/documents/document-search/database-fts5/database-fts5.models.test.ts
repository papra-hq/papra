import { describe, expect, test } from 'vitest';
import { buildFts5ColumnMatchTerm } from './database-fts5.models';

describe('database-fts5 models', () => {
  describe('buildFts5ColumnMatchTerm', () => {
    test('multiple column names are joined with a space and wrapped in curly braces', () => {
      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name', 'content'],
          value: 'foo',
          isExactMatch: false,
        }),
      ).to.eql('{name content}:"foo"*');

      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name', 'content', 'notes'],
          value: 'foo',
          isExactMatch: false,
        }),
      ).to.eql('{name content notes}:"foo"*');

      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name', 'content'],
          value: 'foo',
          isExactMatch: true,
        }),
      ).to.eql('{name content}:"foo"');
    });

    test('single column name is not wrapped in curly braces', () => {
      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name'],
          value: 'foo',
          isExactMatch: false,
        }),
      ).to.eql('name:"foo"*');

      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name'],
          value: 'foo',
          isExactMatch: true,
        }),
      ).to.eql('name:"foo"');
    });

    test('no column names results in a query atom without column prefix', () => {
      expect(
        buildFts5ColumnMatchTerm({
          columnNames: [],
          value: 'foo',
          isExactMatch: false,
        }),
      ).to.eql('"foo"*');

      expect(
        buildFts5ColumnMatchTerm({
          columnNames: [],
          value: 'foo',
          isExactMatch: true,
        }),
      ).to.eql('"foo"');
    });

    test('value is wrapped in double quotes, and other quotes are replaced with spaces in order to preserve tokenization', () => {
      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name'],
          value: `c'est "foo"`,
          isExactMatch: false,
        }),
      ).to.eql('name:"c est  foo "*');
    });

    test('non exact match appends a wildcard to the value for prefixed search', () => {
      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name'],
          value: 'foo',
          isExactMatch: false,
        }),
      ).to.eql('name:"foo"*');

      expect(
        buildFts5ColumnMatchTerm({
          columnNames: ['name'],
          value: 'foo',
          isExactMatch: true,
        }),
      ).to.eql('name:"foo"');
    });
  });
});
