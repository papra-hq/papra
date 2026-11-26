import type { FilterExpression, Operator } from './parser.types';
import { describe, expect, test } from 'vitest';
import { ERROR_CODES } from './errors';
import { DEFAULT_OPERATORS } from './operators';
import { parseSearchQuery } from './parser';

// These assertions are enforced by `tsc --noEmit`, the runtime expectations only
// ensure the file is also covered by the test suite.
describe('parser types', () => {
  test('the built-in operator union is preserved when no custom operators are provided', () => {
    const { expression } = parseSearchQuery({ query: 'tag:invoice' });

    if (expression.type === 'filter') {
      const operator: Operator = expression.operator;

      expect(operator).toBe('=');
    }
  });

  test('custom operators are inferred as a literal union, without requiring `as const`', () => {
    const { expression } = parseSearchQuery({ query: 'tag:~invoice', operators: ['=', '~'] });

    if (expression.type === 'filter') {
      const operator: '=' | '~' = expression.operator;

      expect(operator).toBe('~');
    }
  });

  test('the default operator has to be one of the declared operators, and is discarded at runtime otherwise', () => {
    const { expression, issues } = parseSearchQuery({
      query: 'tag:invoice',
      operators: ['=', '~'],
      // @ts-expect-error `>` is not part of the declared operators
      defaultOperator: '>',
    });

    // Untyped consumers can still reach this, so the undeclared default is discarded
    expect(expression).toEqual({ type: 'filter', field: 'tag', operator: '=', value: 'invoice' });
    expect(issues).toEqual([
      {
        code: ERROR_CODES.INVALID_OPERATOR,
        message:
          'Default operator ">" is not one of the declared operators, "=" has been used instead',
      },
    ]);
  });

  test('the built-in operators can be spread to extend them, rather than restated', () => {
    const { expression } = parseSearchQuery({
      query: 'name:~invoice',
      operators: [...DEFAULT_OPERATORS, '~'],
    });

    if (expression.type === 'filter') {
      const operator: Operator | '~' = expression.operator;

      expect(operator).toBe('~');
    }
  });

  test('the default operator is required when `=` is dropped from the operator set', () => {
    const { expression } = parseSearchQuery({
      query: 'tag:invoice',
      operators: ['~'],
      defaultOperator: '~',
    });

    // @ts-expect-error `defaultOperator` is required, as `=` is not a declared operator
    parseSearchQuery({ query: 'tag:invoice', operators: ['~'] });

    expect(expression).toEqual({ type: 'filter', field: 'tag', operator: '~', value: 'invoice' });
  });

  test('the expression types stay usable without a type argument, for consumers of the built-in operators', () => {
    const filter: FilterExpression = { type: 'filter', field: 'tag', operator: '>=', value: '42' };
    const operatorsMap: Record<Operator, string> = {
      '=': 'eq',
      '<': 'lt',
      '<=': 'lte',
      '>': 'gt',
      '>=': 'gte',
    };

    expect(operatorsMap[filter.operator]).toBe('gte');
  });
});
