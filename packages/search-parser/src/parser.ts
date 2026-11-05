import type { Expression, Issue, Operator, ParsedQuery } from './parser.types';
import type { Token } from './tokenizer';
import { ERROR_CODES } from './errors';
import { simplifyExpression } from './optimization';
import { createOperatorMatcher, DEFAULT_OPERATOR, DEFAULT_OPERATORS } from './operators';
import { tokenize } from './tokenizer';

export type ParseSearchQueryOptions = {
  query: string;
  maxDepth?: number;
  maxTokens?: number;
  optimize?: boolean;
};

/**
 * `defaultOperator` is what a filter without an explicit operator, like `tag:invoice`, means.
 * It defaults to `=`, so it only becomes required when `=` is dropped from the operator set,
 * as there would otherwise be no sound value to fall back to.
 */
export type ParseSearchQueryOperatorOptions<TOperator extends string> = '=' extends TOperator
  ? { operators?: readonly TOperator[]; defaultOperator?: NoInfer<TOperator> }
  : { operators: readonly TOperator[]; defaultOperator: NoInfer<TOperator> };

export function parseSearchQuery<const TOperator extends string = Operator>(
  options: ParseSearchQueryOptions & ParseSearchQueryOperatorOptions<TOperator>,
): ParsedQuery<TOperator> {
  // The conditional operator options are deferred while TOperator is unresolved, so they are
  // read through the shape both of its branches share.
  const {
    query,
    maxDepth = 10,
    maxTokens = 200,
    optimize = true,
    operators = DEFAULT_OPERATORS as readonly TOperator[],
    defaultOperator = DEFAULT_OPERATOR as TOperator,
  } = options as ParseSearchQueryOptions & {
    operators?: readonly TOperator[];
    defaultOperator?: TOperator;
  };

  const { matcher, issues: operatorIssues } = createOperatorMatcher({
    operators,
    defaultOperator,
  });

  const { tokens, issues: tokenizerIssues } = tokenize({
    query,
    maxTokens,
    operatorMatcher: matcher,
  });

  const { expression, issues: parserIssues } = parseExpression({ tokens, maxDepth });

  const issues = [...operatorIssues, ...tokenizerIssues, ...parserIssues];

  if (!optimize) {
    return {
      expression,
      issues,
    };
  }

  const { expression: optimizedExpression } = simplifyExpression({ expression });

  return {
    expression: optimizedExpression,
    issues,
  };
}

function parseExpression<TOperator extends string>({
  tokens,
  maxDepth,
}: {
  tokens: Token<TOperator>[];
  maxDepth: number;
}): ParsedQuery<TOperator> {
  const parserIssues: Issue[] = [];

  let currentTokenIndex = 0;
  let currentDepth = 0;

  const peek = (): Token<TOperator> => tokens[currentTokenIndex] ?? { type: 'EOF' };
  const advance = (): Token<TOperator> => tokens[currentTokenIndex++] ?? { type: 'EOF' };

  const checkDepth = (): boolean => {
    if (currentDepth >= maxDepth) {
      parserIssues.push({
        code: ERROR_CODES.MAX_NESTING_DEPTH_EXCEEDED,
        message: `Maximum nesting depth of ${maxDepth} exceeded`,
      });
      return false;
    }
    return true;
  };

  // Parse primary expression (filter, parentheses, text)
  function parsePrimaryExpression(): Expression<TOperator> | undefined {
    const token = peek();

    if (token.type === 'LPAREN') {
      advance(); // Consume (

      if (!checkDepth()) {
        return undefined;
      }

      currentDepth++;
      const expr = parseOrExpression();
      currentDepth--;

      if (peek().type === 'RPAREN') {
        advance(); // Consume )
      } else {
        parserIssues.push({
          code: ERROR_CODES.UNMATCHED_OPENING_PARENTHESIS,
          message: 'Unmatched opening parenthesis',
        });
      }

      return expr;
    }

    if (token.type === 'FILTER') {
      advance();
      return {
        type: 'filter',
        field: token.field,
        operator: token.operator,
        value: token.value,
      };
    }

    if (token.type === 'TEXT') {
      advance();
      return {
        type: 'text',
        value: token.value,
      };
    }

    return undefined;
  }

  function parseUnaryExpression(): Expression<TOperator> | undefined {
    if (peek().type === 'NOT') {
      advance(); // Consume NOT

      if (!checkDepth()) {
        return undefined;
      }

      currentDepth++;
      const operand = parseUnaryExpression();
      currentDepth--;

      if (!operand) {
        parserIssues.push({
          code: ERROR_CODES.MISSING_OPERAND_FOR_NOT,
          message: 'NOT operator requires an operand',
        });
        return undefined;
      }

      return { type: 'not', operand };
    }

    return parsePrimaryExpression();
  }

  function parseAndExpression(): Expression<TOperator> | undefined {
    const operands: Expression<TOperator>[] = [];

    while (true) {
      const next = peek();

      // Stop if we hit EOF, OR operator, or closing paren
      if (next.type === 'EOF' || next.type === 'OR' || next.type === 'RPAREN') {
        break;
      }

      // Consume explicit AND operator
      if (next.type === 'AND') {
        advance();
        continue;
      }

      const expr = parseUnaryExpression();
      if (expr) {
        operands.push(expr);
      }
    }

    if (operands.length === 0) {
      return undefined;
    }

    if (operands.length === 1) {
      return operands[0];
    }

    return { type: 'and', operands };
  }

  function parseOrExpression(): Expression<TOperator> | undefined {
    const left = parseAndExpression();
    if (!left) {
      return undefined;
    }

    const operands: Expression<TOperator>[] = [left];

    while (peek().type === 'OR') {
      advance(); // Consume OR
      const right = parseAndExpression();
      if (right) {
        operands.push(right);
      }
    }

    if (operands.length === 1) {
      return operands[0];
    }

    return { type: 'or', operands };
  }

  const expression = parseOrExpression();

  // Check for unmatched closing parentheses
  while (peek().type === 'RPAREN') {
    parserIssues.push({
      message: 'Unmatched closing parenthesis',
      code: ERROR_CODES.UNMATCHED_CLOSING_PARENTHESIS,
    });
    advance();
  }

  return {
    expression: expression ?? { type: 'empty' },
    issues: parserIssues,
  };
}
