import { describe, expect, test } from 'vitest';
import { parseSearchQuery } from './parser';

describe('parseSearchQuery', () => {
  describe('when parsing simple queries', () => {
    test('returns empty expression and no search terms for empty query', () => {
      expect(parseSearchQuery({ query: '' })).toEqual({
        expression: { type: 'empty' },
        issues: [],
      });

      expect(parseSearchQuery({ query: '  ' })).toEqual({
        expression: { type: 'empty' },
        issues: [],
      });

      expect(parseSearchQuery({ query: ' \n \t ' })).toEqual({
        expression: { type: 'empty' },
        issues: [],
      });
    });

    test('extracts full-text search terms when no filters present', () => {
      expect(parseSearchQuery({ query: 'my invoice' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'my' },
            { type: 'text', value: 'invoice' },
          ],
        },
        issues: [],
      });
    });

    test('handles quoted search terms', () => {
      expect(parseSearchQuery({ query: '"my special invoice"' })).toEqual({
        expression: { type: 'text', value: 'my special invoice' },
        issues: [],
      });
    });

    test('handles escaped quotes in search terms', () => {
      expect(parseSearchQuery({ query: '"my \\"special\\" invoice"' })).toEqual({
        expression: { type: 'text', value: 'my "special" invoice' },
        issues: [],
      });
    });

    test('handles escaped colons to prevent filter parsing', () => {
      expect(parseSearchQuery({ query: 'tag\\:invoice' })).toEqual({
        expression: { type: 'text', value: 'tag:invoice' },
        issues: [],
      });
    });
  });

  describe('when parsing filter expressions', () => {
    test('parses simple filter with equality operator', () => {
      expect(parseSearchQuery({ query: 'tag:invoice' })).toEqual({
        expression: {
          type: 'filter',
          field: 'tag',
          operator: '=',
          value: 'invoice',
        },
        issues: [],
      });
    });

    test('parses filter with explicit equality operator', () => {
      expect(parseSearchQuery({ query: 'tag:=invoice' })).toEqual({
        expression: {
          type: 'filter',
          field: 'tag',
          operator: '=',
          value: 'invoice',
        },
        issues: [],
      });
    });

    test('parses filter with quoted value containing spaces', () => {
      expect(parseSearchQuery({ query: 'tag:"my invoices"' })).toEqual({
        expression: {
          type: 'filter',
          field: 'tag',
          operator: '=',
          value: 'my invoices',
        },
        issues: [],
      });
    });

    test('parses filter with escaped quotes in value', () => {
      expect(parseSearchQuery({ query: 'tag:"my \\"special\\" invoices"' })).toEqual({
        expression: {
          type: 'filter',
          field: 'tag',
          operator: '=',
          value: 'my "special" invoices',
        },
        issues: [],
      });
    });

    test('parses filter with escaped colons in value', () => {
      expect(parseSearchQuery({ query: 'tag:my\\:\\:special\\:\\:tag' })).toEqual({
        expression: {
          type: 'filter',
          field: 'tag',
          operator: '=',
          value: 'my::special::tag',
        },
        issues: [],
      });
    });

    test('parses filter with escaped colons in field name', () => {
      expect(parseSearchQuery({ query: 'my\\:field:value' })).toEqual({
        expression: {
          type: 'filter',
          field: 'my:field',
          operator: '=',
          value: 'value',
        },
        issues: [],
      });
    });

    test('parses filter with comparison operators', () => {
      expect(parseSearchQuery({ query: 'createdAt:>2024-01-01' })).toEqual({
        expression: {
          type: 'filter',
          field: 'createdAt',
          operator: '>',
          value: '2024-01-01',
        },
        issues: [],
      });

      expect(parseSearchQuery({ query: 'createdAt:<2024-01-01' })).toEqual({
        expression: {
          type: 'filter',
          field: 'createdAt',
          operator: '<',
          value: '2024-01-01',
        },
        issues: [],
      });

      expect(parseSearchQuery({ query: 'createdAt:>=2024-01-01' })).toEqual({
        expression: {
          type: 'filter',
          field: 'createdAt',
          operator: '>=',
          value: '2024-01-01',
        },
        issues: [],
      });

      expect(parseSearchQuery({ query: 'createdAt:<=2024-01-01' })).toEqual({
        expression: {
          type: 'filter',
          field: 'createdAt',
          operator: '<=',
          value: '2024-01-01',
        },
        issues: [],
      });
    });

    test('parses negated filter with minus prefix', () => {
      expect(parseSearchQuery({ query: '-tag:personal' })).toEqual({
        expression: {
          type: 'not',
          operand: {
            type: 'filter',
            field: 'tag',
            operator: '=',
            value: 'personal',
          },
        },
        issues: [],
      });
    });
  });

  describe('when combining filters and search terms', () => {
    test('combines filter with search terms', () => {
      expect(parseSearchQuery({ query: 'tag:invoice my invoice' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'text', value: 'my' },
            { type: 'text', value: 'invoice' },
          ],
        },
        issues: [],
      });
    });

    test('extracts search terms before and after filters', () => {
      expect(parseSearchQuery({ query: 'foo tag:invoice bar' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'foo' },
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'text', value: 'bar' },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when using AND operator', () => {
    test('combines filters with explicit AND', () => {
      expect(parseSearchQuery({ query: 'tag:invoice AND tag:receipt' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
        issues: [],
      });
    });

    test('combines filters with implicit AND', () => {
      expect(parseSearchQuery({ query: 'tag:invoice tag:receipt' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
        issues: [],
      });
    });

    test('combines multiple filters with AND', () => {
      expect(parseSearchQuery({ query: 'tag:invoice createdAt:>2024-01-01 status:active' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' },
            { type: 'filter', field: 'status', operator: '=', value: 'active' },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when using OR operator', () => {
    test('combines filters with OR', () => {
      expect(parseSearchQuery({ query: 'tag:invoice OR tag:receipt' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
        issues: [],
      });
    });

    test('combines multiple filters with OR', () => {
      expect(parseSearchQuery({ query: 'tag:invoice OR tag:receipt OR tag:bill' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
            { type: 'filter', field: 'tag', operator: '=', value: 'bill' },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when using NOT operator', () => {
    test('negates filter with NOT keyword', () => {
      expect(parseSearchQuery({ query: 'NOT tag:personal' })).toEqual({
        expression: {
          type: 'not',
          operand: {
            type: 'filter',
            field: 'tag',
            operator: '=',
            value: 'personal',
          },
        },
        issues: [],
      });
    });

    test('negates grouped expression', () => {
      expect(parseSearchQuery({ query: 'NOT (tag:personal OR tag:private)' })).toEqual({
        expression: {
          type: 'not',
          operand: {
            type: 'or',
            operands: [
              { type: 'filter', field: 'tag', operator: '=', value: 'personal' },
              { type: 'filter', field: 'tag', operator: '=', value: 'private' },
            ],
          },
        },
        issues: [],
      });
    });
  });

  describe('when using grouping with parentheses', () => {
    test('groups expressions with parentheses', () => {
      expect(parseSearchQuery({ query: '(tag:invoice OR tag:receipt)' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
        issues: [],
      });
    });

    test('combines grouped expressions with AND', () => {
      expect(parseSearchQuery({ query: '(tag:invoice OR tag:receipt) AND createdAt:>2024-01-01' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'or',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
              ],
            },
            { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' },
          ],
        },
        issues: [],
      });
    });

    test('handles nested grouping', () => {
      expect(parseSearchQuery({ query: '((tag:invoice OR tag:receipt) AND status:active)' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'or',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
              ],
            },
            { type: 'filter', field: 'status', operator: '=', value: 'active' },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when respecting operator precedence', () => {
    test('aND binds tighter than OR', () => {
      expect(parseSearchQuery({ query: 'tag:invoice OR tag:receipt AND tag:company' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            {
              type: 'and',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
                { type: 'filter', field: 'tag', operator: '=', value: 'company' },
              ],
            },
          ],
        },
        issues: [],
      });
    });

    test('nOT binds tighter than AND', () => {
      expect(parseSearchQuery({ query: 'NOT tag:invoice AND tag:receipt' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'not',
              operand: { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
        issues: [],
      });
    });

    test('parentheses override precedence', () => {
      expect(parseSearchQuery({ query: '(tag:invoice OR tag:receipt) AND tag:company' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'or',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
              ],
            },
            { type: 'filter', field: 'tag', operator: '=', value: 'company' },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when handling malformed queries', () => {
    test('handles unclosed quoted string gracefully', () => {
      const result = parseSearchQuery({ query: '"unclosed string' });
      expect(result.expression).toEqual({
        type: 'text',
        value: 'unclosed string',
      });
      expect(result.issues).toContainEqual({
        code: 'unclosed-quoted-string',
        message: 'Unclosed quoted string',
      });
    });

    test('handles unmatched opening parenthesis gracefully', () => {
      const result = parseSearchQuery({ query: '(tag:invoice' });
      expect(result.expression).toEqual({
        type: 'filter',
        field: 'tag',
        operator: '=',
        value: 'invoice',
      });
      expect(result.issues).toContainEqual({
        code: 'unmatched-opening-parenthesis',
        message: 'Unmatched opening parenthesis',
      });
    });

    test('handles unmatched closing parenthesis gracefully', () => {
      const result = parseSearchQuery({ query: 'tag:invoice)' });
      expect(result.expression).toEqual({
        type: 'filter',
        field: 'tag',
        operator: '=',
        value: 'invoice',
      });
      expect(result.issues).toContainEqual({
        code: 'unmatched-closing-parenthesis',
        message: 'Unmatched closing parenthesis',
      });
    });

    test('handles NOT without operand gracefully', () => {
      const result = parseSearchQuery({ query: 'tag:invoice AND NOT' });
      expect(result.expression).toEqual({
        type: 'filter',
        field: 'tag',
        operator: '=',
        value: 'invoice',
      });
      expect(result.issues).toContainEqual({
        code: 'missing-operand-for-not',
        message: 'NOT operator requires an operand',
      });
    });
  });

  describe('when enforcing limits', () => {
    test('respects maximum token limit', () => {
      const longQuery = Array.from({ length: 50 }).map((_, i) => `tag${i}:value${i}`).join(' ');
      const result = parseSearchQuery({ query: longQuery, maxTokens: 10 });
      expect(result.issues).toContainEqual({
        code: 'max-tokens-exceeded',
        message: 'Maximum token limit of 10 exceeded',
      });
    });

    test('respects maximum depth limit', () => {
      const deepQuery = '((((((((((tag:invoice))))))))))';
      const result = parseSearchQuery({ query: deepQuery, maxDepth: 5 });
      expect(result.issues).toContainEqual({
        code: 'max-nesting-depth-exceeded',
        message: 'Maximum nesting depth of 5 exceeded',
      });
    });
  });

  describe('when handling complex real-world queries', () => {
    test('parses complex query with multiple operators and grouping', () => {
      expect(
        parseSearchQuery({
          query: '(tag:invoice OR tag:receipt) AND createdAt:>2024-01-01 AND NOT tag:personal my document',
        }),
      ).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'or',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
              ],
            },
            { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' },
            {
              type: 'not',
              operand: { type: 'filter', field: 'tag', operator: '=', value: 'personal' },
            },
            { type: 'text', value: 'my' },
            { type: 'text', value: 'document' },
          ],
        },
        issues: [],
      });
    });

    test('parses query with multiple negations', () => {
      expect(parseSearchQuery({ query: '-tag:personal -tag:private -tag:confidential' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            {
              type: 'not',
              operand: { type: 'filter', field: 'tag', operator: '=', value: 'personal' },
            },
            {
              type: 'not',
              operand: { type: 'filter', field: 'tag', operator: '=', value: 'private' },
            },
            {
              type: 'not',
              operand: { type: 'filter', field: 'tag', operator: '=', value: 'confidential' },
            },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when parsing text with boolean operators', () => {
    test('parses text OR text as OR expression', () => {
      expect(parseSearchQuery({ query: 'foo OR bar' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'foo' },
            { type: 'text', value: 'bar' },
          ],
        },
        issues: [],
      });
    });

    test('parses text with implicit AND correctly', () => {
      expect(parseSearchQuery({ query: 'foo bar baz' })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'foo' },
            { type: 'text', value: 'bar' },
            { type: 'text', value: 'baz' },
          ],
        },
        issues: [],
      });
    });

    test('negated text creates NOT expression', () => {
      expect(parseSearchQuery({ query: '-foo' })).toEqual({
        expression: {
          type: 'not',
          operand: { type: 'text', value: 'foo' },
        },
        issues: [],
      });
    });

    test('handles complex text with operators', () => {
      expect(
        parseSearchQuery({
          query: '(tag:invoice foo) OR (tag:receipt bar)',
        }),
      ).toEqual({
        expression: {
          type: 'or',
          operands: [
            {
              type: 'and',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
                { type: 'text', value: 'foo' },
              ],
            },
            {
              type: 'and',
              operands: [
                { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
                { type: 'text', value: 'bar' },
              ],
            },
          ],
        },
        issues: [],
      });
    });

    test('parses multiple ORs with text and filters', () => {
      expect(parseSearchQuery({ query: 'foo OR bar OR baz' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'foo' },
            { type: 'text', value: 'bar' },
            { type: 'text', value: 'baz' },
          ],
        },
        issues: [],
      });
    });

    test('parses quoted text with spaces', () => {
      expect(parseSearchQuery({ query: '"hello world"' })).toEqual({
        expression: { type: 'text', value: 'hello world' },
        issues: [],
      });
    });

    test('parses negated quoted text', () => {
      expect(parseSearchQuery({ query: '-"hello world"' })).toEqual({
        expression: {
          type: 'not',
          operand: { type: 'text', value: 'hello world' },
        },
        issues: [],
      });
    });

    test('parses text mixed with explicit NOT operator', () => {
      expect(parseSearchQuery({ query: 'NOT foo' })).toEqual({
        expression: {
          type: 'not',
          operand: { type: 'text', value: 'foo' },
        },
        issues: [],
      });
    });

    test('respects AND precedence over OR in text expressions', () => {
      expect(parseSearchQuery({ query: 'foo OR bar AND baz' })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'foo' },
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'bar' },
                { type: 'text', value: 'baz' },
              ],
            },
          ],
        },
        issues: [],
      });
    });
  });

  describe('when using optimization', () => {
    test('applies optimization when optimize flag is true', () => {
      // Query that creates nested AND that can be flattened
      const result = parseSearchQuery({
        query: 'foo foo bar',
        optimize: true,
      });

      // Should remove duplicate 'foo' through optimization
      expect(result.expression).toEqual({
        type: 'and',
        operands: [
          { type: 'text', value: 'foo' },
          { type: 'text', value: 'bar' },
        ],
      });
      expect(result.issues).toEqual([]);
    });

    test('does not apply optimization when optimize flag is false', () => {
      const result = parseSearchQuery({
        query: 'foo foo bar',
        optimize: false,
      });

      // Should keep duplicates without optimization
      expect(result.expression).toEqual({
        type: 'and',
        operands: [
          { type: 'text', value: 'foo' },
          { type: 'text', value: 'foo' },
          { type: 'text', value: 'bar' },
        ],
      });
      expect(result.issues).toEqual([]);
    });

    test('does not apply optimization by default', () => {
      const result = parseSearchQuery({ query: 'foo foo bar' });

      // Should keep duplicates without optimization (default behavior)
      expect(result.expression).toEqual({
        type: 'and',
        operands: [
          { type: 'text', value: 'foo' },
          { type: 'text', value: 'foo' },
          { type: 'text', value: 'bar' },
        ],
      });
      expect(result.issues).toEqual([]);
    });

    test('applies optimization to complex queries', () => {
      // Query with double negation and duplicates
      const result = parseSearchQuery({
        query: '(tag:invoice OR tag:invoice) AND NOT NOT tag:receipt',
        optimize: true,
      });

      expect(result.expression).toEqual({
        type: 'and',
        operands: [
          { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
          { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
        ],
      });
      expect(result.issues).toEqual([]);
    });
  });
});
