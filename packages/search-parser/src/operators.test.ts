import { describe, expect, test } from 'vitest';
import { ERROR_CODES } from './errors';
import { createOperatorMatcher, DEFAULT_OPERATOR, DEFAULT_OPERATORS } from './operators';

describe('operators', () => {
  describe('createOperatorMatcher', () => {
    describe('the longest operator always wins, so that an operator like >= is not shadowed by >, regardless of the order in which the operators are declared', () => {
      test('matches the longest operator first', () => {
        const { matcher } = createOperatorMatcher({
          operators: ['=', '>', '>='],
          defaultOperator: '=',
        });

        expect(matcher.matchAt('>=42', 0)).toEqual({ operator: '>=', length: 2 });
      });

      test('matches the longest custom operator first', () => {
        const { matcher } = createOperatorMatcher({
          operators: ['~', '~=', '='],
          defaultOperator: '=',
        });

        expect(matcher.matchAt('~=42', 0)).toEqual({ operator: '~=', length: 2 });
        expect(matcher.matchAt('~42', 0)).toEqual({ operator: '~', length: 1 });
      });
    });

    test('matches operators at an arbitrary index', () => {
      const { matcher } = createOperatorMatcher({
        operators: DEFAULT_OPERATORS,
        defaultOperator: DEFAULT_OPERATOR,
      });

      expect(matcher.matchAt('tag:>=42', 4)).toEqual({ operator: '>=', length: 2 });
    });

    test('returns undefined when no operator matches', () => {
      const { matcher } = createOperatorMatcher({
        operators: DEFAULT_OPERATORS,
        defaultOperator: DEFAULT_OPERATOR,
      });

      expect(matcher.matchAt('invoice', 0)).toBe(undefined);
    });

    describe('as the parser is error resilient, invalid operators are discarded and reported as issues, instead of throwing', () => {
      test('discards empty operators', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['=', ''],
          defaultOperator: '=',
        });

        expect(matcher.matchAt('', 0)).toBe(undefined);
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message: 'Operators cannot be empty, it has been ignored',
          },
        ]);
      });

      test('discards operators containing characters that delimit tokens', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['=', 'a b', '(', '"'],
          defaultOperator: '=',
        });

        expect(matcher.matchAt('(', 0)).toBe(undefined);
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Operator "a b" cannot contain whitespaces, parentheses or quotes, it has been ignored',
          },
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Operator "(" cannot contain whitespaces, parentheses or quotes, it has been ignored',
          },
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Operator """ cannot contain whitespaces, parentheses or quotes, it has been ignored',
          },
        ]);
      });

      test('discards a default operator that is not one of the declared operators, falling back to `=`', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['=', '~'],
          defaultOperator: '>',
        });

        expect(matcher.defaultOperator).toBe('=');
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Default operator ">" is not one of the declared operators, "=" has been used instead',
          },
        ]);
      });

      test('discards a default operator that has itself been rejected', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['=', 'a b'],
          defaultOperator: 'a b',
        });

        expect(matcher.defaultOperator).toBe('=');
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Operator "a b" cannot contain whitespaces, parentheses or quotes, it has been ignored',
          },
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Default operator "a b" is not one of the declared operators, "=" has been used instead',
          },
        ]);
      });

      test('falls back to the first declared operator when `=` is not declared', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['~', '^'],
          defaultOperator: '>',
        });

        expect(matcher.defaultOperator).toBe('~');
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Default operator ">" is not one of the declared operators, "~" has been used instead',
          },
        ]);
      });

      test('falls back to the built-in `=` when every declared operator has been rejected, as no declared operator is left', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['a b'],
          defaultOperator: 'a b',
        });

        expect(matcher.defaultOperator).toBe('=');
        expect(issues).toEqual([
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'Operator "a b" cannot contain whitespaces, parentheses or quotes, it has been ignored',
          },
          {
            code: ERROR_CODES.INVALID_OPERATOR,
            message:
              'No operator has been declared, the built-in "=" has been used for filters without an explicit operator',
          },
        ]);
      });

      test('silently ignores duplicated operators', () => {
        const { matcher, issues } = createOperatorMatcher({
          operators: ['=', '=', '~'],
          defaultOperator: '=',
        });

        expect(matcher.matchAt('~foo', 0)).toEqual({ operator: '~', length: 1 });
        expect(issues).toEqual([]);
      });
    });
  });
});
