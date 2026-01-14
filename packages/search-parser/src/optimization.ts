import type { AndExpression, Expression, OrExpression } from './parser.types';

/**
 * Simplifies an expression tree by applying optimization rules.
 * - AND/OR expressions with a single child are replaced by that child.
 * - NOT expressions with a NOT child are replaced by the grandchild (double negation).
 * - Nested AND/OR expressions are flattened.
 * - Redundant expressions are removed (duplicates, empty expressions).
 * - Empty AND/OR expressions are converted to 'empty'.
 */
export function simplifyExpression({ expression }: { expression: Expression }): { expression: Expression } {
  return { expression: simplify(expression) };
}

/**
 * Recursively simplifies an expression tree using post-order traversal.
 * Children are optimized before their parents.
 */
function simplify(expression: Expression): Expression {
  // Base cases: leaf nodes that can't be simplified further
  if (expression.type === 'empty' || expression.type === 'text' || expression.type === 'filter') {
    return expression;
  }

  // Recursive case: NOT expression
  if (expression.type === 'not') {
    const simplifiedOperand = simplify(expression.operand);

    // Double negation elimination: NOT(NOT(A)) -> A
    if (simplifiedOperand.type === 'not') {
      return simplifiedOperand.operand;
    }

    // Empty propagation: NOT(empty) -> empty
    if (simplifiedOperand.type === 'empty') {
      return { type: 'empty' };
    }

    return { type: 'not', operand: simplifiedOperand };
  }

  // Recursive case: AND/OR expressions
  if (expression.type === 'and' || expression.type === 'or') {
    // Step 1: Simplify all operands recursively
    let simplifiedOperands = expression.operands.map(simplify);

    // Step 2: Flatten nested expressions of the same type
    simplifiedOperands = flattenOperands(expression.type, simplifiedOperands);

    // Step 3: Remove empty expressions
    simplifiedOperands = simplifiedOperands.filter(op => op.type !== 'empty');

    // Step 4: Remove duplicates (order-preserving)
    simplifiedOperands = deduplicateOperands(simplifiedOperands);

    // Step 5: Apply identity laws
    // Empty: AND() -> empty, OR() -> empty
    if (simplifiedOperands.length === 0) {
      return { type: 'empty' };
    }

    // Single child: AND(A) -> A, OR(A) -> A
    if (simplifiedOperands.length === 1) {
      return simplifiedOperands[0]!;
    }

    // Return simplified AND/OR expression
    return {
      type: expression.type,
      operands: simplifiedOperands,
    } as AndExpression | OrExpression;
  }

  // This should never be reached if Expression type is exhaustive
  return expression;
}

/**
 * Flattens nested AND/OR expressions of the same type.
 * Example: AND(A, AND(B, C)) -> AND(A, B, C)
 */
function flattenOperands(type: 'and' | 'or', operands: Expression[]): Expression[] {
  const flattened: Expression[] = [];

  for (const operand of operands) {
    // If operand is same type (AND/OR), merge its children
    if (operand.type === type) {
      flattened.push(...operand.operands);
    } else {
      flattened.push(operand);
    }
  }

  return flattened;
}

/**
 * Removes duplicate operands while preserving order.
 * Uses deep equality comparison.
 */
function deduplicateOperands(operands: Expression[]): Expression[] {
  const deduplicated: Expression[] = [];

  for (const operand of operands) {
    // Only add if not already present
    const isDuplicate = deduplicated.some(existing => expressionsEqual(existing, operand));
    if (!isDuplicate) {
      deduplicated.push(operand);
    }
  }

  return deduplicated;
}

/**
 * Deep equality comparison for expressions.
 * Order-sensitive: AND(A, B) !== AND(B, A)
 */
function expressionsEqual(a: Expression, b: Expression): boolean {
  // Different types are not equal
  if (a.type !== b.type) {
    return false;
  }

  // Empty expressions are always equal
  if (a.type === 'empty') {
    return true;
  }

  // Text expressions: compare values
  if (a.type === 'text' && b.type === 'text') {
    return a.value === b.value;
  }

  // Filter expressions: compare all fields
  if (a.type === 'filter' && b.type === 'filter') {
    return a.field === b.field
      && a.operator === b.operator
      && a.value === b.value;
  }

  // NOT expressions: compare operands
  if (a.type === 'not' && b.type === 'not') {
    return expressionsEqual(a.operand, b.operand);
  }

  // AND/OR expressions: compare operands arrays (order-sensitive)
  if ((a.type === 'and' && b.type === 'and') || (a.type === 'or' && b.type === 'or')) {
    if (a.operands.length !== b.operands.length) {
      return false;
    }

    // Compare each operand in order
    for (let i = 0; i < a.operands.length; i++) {
      if (!expressionsEqual(a.operands[i]!, b.operands[i]!)) {
        return false;
      }
    }

    return true;
  }

  // Fallback: not equal
  return false;
}
