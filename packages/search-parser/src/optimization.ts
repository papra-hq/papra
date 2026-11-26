import type { AndExpression, Expression, NotExpression, OrExpression } from './parser.types';

/**
 * Simplifies an expression tree by applying optimization rules.
 * - AND/OR expressions with a single child are replaced by that child.
 * - NOT expressions with a NOT child are replaced by the grandchild (double negation).
 * - Nested AND/OR expressions are flattened.
 * - Redundant expressions are removed (duplicates, empty expressions).
 * - Empty AND/OR expressions are converted to 'empty'.
 */
export function simplifyExpression<TOperator extends string>({
  expression,
}: {
  expression: Expression<TOperator>;
}): {
  expression: Expression<TOperator>;
} {
  if (expression.type === 'empty' || expression.type === 'text' || expression.type === 'filter') {
    return { expression };
  }

  if (expression.type === 'not') {
    return simplifyNotExpression({ expression });
  }

  if (expression.type === 'and' || expression.type === 'or') {
    return simplifyAndOrExpression({ expression });
  }

  // This should never be reached, but hey, you never know
  return { expression };
}

export function simplifyOperands<TOperator extends string>({
  operands,
}: {
  operands: Expression<TOperator>[];
}): {
  simplifiedOperands: Expression<TOperator>[];
} {
  const simplifiedOperands = operands.map(
    (expression) => simplifyExpression({ expression }).expression,
  );

  return { simplifiedOperands };
}

function simplifyNotExpression<TOperator extends string>({
  expression,
}: {
  expression: NotExpression<TOperator>;
}): {
  expression: Expression<TOperator>;
} {
  const { expression: simplifiedOperandExpression } = simplifyExpression({
    expression: expression.operand,
  });

  // NOT(NOT(A)) -> A
  if (simplifiedOperandExpression.type === 'not') {
    return { expression: simplifiedOperandExpression.operand };
  }

  // NOT(empty) -> empty
  if (simplifiedOperandExpression.type === 'empty') {
    return { expression: { type: 'empty' } };
  }

  return { expression: { type: 'not', operand: simplifiedOperandExpression } };
}

function simplifyAndOrExpression<TOperator extends string>({
  expression,
}: {
  expression: AndExpression<TOperator> | OrExpression<TOperator>;
}): {
  expression: Expression<TOperator>;
} {
  const { simplifiedOperands } = simplifyOperands({ operands: expression.operands });
  const filteredOperands = simplifiedOperands.filter((op) => op.type !== 'empty');
  const { flattenedOperands } = flattenOperands({
    type: expression.type,
    operands: filteredOperands,
  });
  const { deduplicatedOperands } = deduplicateOperands({ operands: flattenedOperands });

  if (deduplicatedOperands.length === 0) {
    return { expression: { type: 'empty' } };
  }

  // AND(A) -> A, OR(A) -> A
  if (deduplicatedOperands.length === 1) {
    return { expression: deduplicatedOperands[0]! };
  }

  return {
    expression: {
      type: expression.type,
      operands: deduplicatedOperands,
    },
  };
}

function flattenOperands<TOperator extends string>({
  type,
  operands,
}: {
  type: 'and' | 'or';
  operands: Expression<TOperator>[];
}): {
  flattenedOperands: Expression<TOperator>[];
} {
  const flattenedOperands: Expression<TOperator>[] = [];

  for (const operand of operands) {
    // When the operand is of the same type, inline its operands
    // AND(A, AND(B, C)) -> AND(A, B, C)
    if (operand.type === type) {
      flattenedOperands.push(...operand.operands);
    } else {
      flattenedOperands.push(operand);
    }
  }

  return { flattenedOperands };
}

function deduplicateOperands<TOperator extends string>({
  operands,
}: {
  operands: Expression<TOperator>[];
}): {
  deduplicatedOperands: Expression<TOperator>[];
} {
  const deduplicatedOperands: Expression<TOperator>[] = [];

  for (const operand of operands) {
    const isDuplicate = deduplicatedOperands.some((existing) =>
      areExpressionsIdentical(existing, operand),
    );
    if (!isDuplicate) {
      deduplicatedOperands.push(operand);
    }
  }

  return { deduplicatedOperands };
}

export function areExpressionsIdentical<TOperator extends string>(
  a: Expression<TOperator>,
  b: Expression<TOperator>,
): boolean {
  if (a.type !== b.type) {
    return false;
  }

  if (a.type === 'empty' && b.type === 'empty') {
    return true;
  }

  if (a.type === 'text' && b.type === 'text') {
    return a.value === b.value;
  }

  if (a.type === 'filter' && b.type === 'filter') {
    return a.field === b.field && a.operator === b.operator && a.value === b.value;
  }

  if (a.type === 'not' && b.type === 'not') {
    return areExpressionsIdentical(a.operand, b.operand);
  }

  if ((a.type === 'and' && b.type === 'and') || (a.type === 'or' && b.type === 'or')) {
    if (a.operands.length !== b.operands.length) {
      return false;
    }

    for (let i = 0; i < a.operands.length; i++) {
      if (!areExpressionsIdentical(a.operands[i]!, b.operands[i]!)) {
        return false;
      }
    }

    return true;
  }

  return false;
}
