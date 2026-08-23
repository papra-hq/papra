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

function getOperatorRejectionReason({ operator }: { operator: string }): string | undefined {
  if (operator.length === 0) {
    return 'Operators cannot be empty';
  }

  if (FORBIDDEN_OPERATOR_CHARACTERS.test(operator)) {
    return `Operator "${operator}" cannot contain whitespaces, parentheses or quotes`;
  }

  return undefined;
}

/**
 * Only a declared operator can end up in the AST, so a default operator that has been
 * rejected, or that was never declared, falls back to a declared one. Otherwise filters
 * without an explicit operator, like `tag:invoice`, would be given an operator the consumer
 * does not know about.
 */
function resolveDefaultOperator<TOperator extends string>({
  defaultOperator,
  validOperators,
}: {
  defaultOperator: TOperator;
  validOperators: readonly TOperator[];
}): { resolvedDefaultOperator: TOperator; issues: Issue[] } {
  if (validOperators.includes(defaultOperator)) {
    return { resolvedDefaultOperator: defaultOperator, issues: [] };
  }

  // `=` is the operator a filter without an explicit one means by default, prefer it when
  // it has been declared, and fall back to the first declared operator otherwise.
  const fallbackOperator =
    validOperators.find((operator) => operator === (DEFAULT_OPERATOR as string)) ??
    validOperators[0] ??
    (DEFAULT_OPERATOR as TOperator);

  return {
    resolvedDefaultOperator: fallbackOperator,
    issues: [
      {
        code: ERROR_CODES.INVALID_OPERATOR,
        message: `Default operator "${defaultOperator}" is not one of the declared operators, "${fallbackOperator}" has been used instead`,
      },
    ],
  };
}

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
  const validOperators: TOperator[] = [];

  for (const operator of operators) {
    if (validOperators.includes(operator)) {
      continue;
    }

    const rejectionReason = getOperatorRejectionReason({ operator });

    if (rejectionReason !== undefined) {
      issues.push({
        code: ERROR_CODES.INVALID_OPERATOR,
        message: `${rejectionReason}, it has been ignored`,
      });
      continue;
    }

    validOperators.push(operator);
  }

  const { resolvedDefaultOperator, issues: defaultOperatorIssues } = resolveDefaultOperator({
    defaultOperator,
    validOperators,
  });

  issues.push(...defaultOperatorIssues);

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

  return { matcher: { defaultOperator: resolvedDefaultOperator, matchAt }, issues };
}
