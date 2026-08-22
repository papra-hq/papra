import type { Issue, Operator } from './parser.types';
import { ERROR_CODES } from './errors';

export const DEFAULT_OPERATORS: readonly Operator[] = ['>=', '<=', '>', '<', '='];
export const DEFAULT_OPERATOR: Operator = '=';

// Operators are matched against the raw query, so they cannot contain characters that
// delimit tokens, otherwise they would never be matched in unquoted filters like `tag:>=1`.
const FORBIDDEN_OPERATOR_CHARACTERS = /[\s()"]/;

export type OperatorMatch<TOperator extends string> = {
  operator: TOperator;
  length: number;
};

export type OperatorMatcher<TOperator extends string> = {
  defaultOperator: TOperator;
  matchAt: (input: string, index: number) => OperatorMatch<TOperator> | undefined;
};

/**
 * Builds the operator matcher used by the tokenizer to recognize filter operators.
 * Invalid operators are discarded and reported as issues, keeping the parser error-resilient.
 */
export function createOperatorMatcher<TOperator extends string>({
  operators,
  defaultOperator,
}: {
  operators: readonly TOperator[];
  defaultOperator: TOperator;
}): { matcher: OperatorMatcher<TOperator>; issues: Issue[] } {
  const issues: Issue[] = [];
  const validOperators = new Set<TOperator>();

  for (const operator of operators) {
    if (operator.length === 0) {
      issues.push({
        code: ERROR_CODES.INVALID_OPERATOR,
        message: 'Operators cannot be empty, it has been ignored',
      });
      continue;
    }

    if (FORBIDDEN_OPERATOR_CHARACTERS.test(operator)) {
      issues.push({
        code: ERROR_CODES.INVALID_OPERATOR,
        message: `Operator "${operator}" cannot contain whitespaces, parentheses or quotes, it has been ignored`,
      });
      continue;
    }

    validOperators.add(operator);
  }

  // Longest operators are matched first, so that `>=` takes precedence over `>`,
  // regardless of the order in which the operators are declared.
  const sortedOperators = [...validOperators].sort((a, b) => b.length - a.length);

  const matchAt = (input: string, index: number): OperatorMatch<TOperator> | undefined => {
    for (const operator of sortedOperators) {
      if (input.startsWith(operator, index)) {
        return { operator, length: operator.length };
      }
    }

    return undefined;
  };

  return { matcher: { defaultOperator, matchAt }, issues };
}
