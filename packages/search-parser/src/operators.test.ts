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
