import type { Expression, Issue, ParsedQuery } from './parser.types';
import type { Token } from './tokenizer';
import { ERROR_CODES } from './errors';
import { simplifyExpression } from './optimization';
import { tokenize } from './tokenizer';

export function parseSearchQuery(
  {
    query,
    maxDepth = 10,
    maxTokens = 200,
    optimize = false,
  }: {
    query: string;
    maxDepth?: number;
    maxTokens?: number;
    optimize?: boolean;
  },
): ParsedQuery {
  const { tokens, issues: tokenizerIssues } = tokenize({ query, maxTokens });

  const { expression, issues: parserIssues } = parseExpression({ tokens, maxDepth });

  const issues = [...tokenizerIssues, ...parserIssues];

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

function parseExpression({ tokens, maxDepth }: { tokens: Token[]; maxDepth: number }): ParsedQuery {
  const parserIssues: Issue[] = [];

  let currentTokenIndex = 0;
  let currentDepth = 0;

  const peek = (): Token => tokens[currentTokenIndex] ?? { type: 'EOF' };
  const advance = (): Token => tokens[currentTokenIndex++] ?? { type: 'EOF' };

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
  function parsePrimaryExpression(): Expression | undefined {
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
      const filterExpr: Expression = {
        type: 'filter',
        field: token.field,
        operator: token.operator,
        value: token.value,
      };

      if (token.negated) {
        return { type: 'not', operand: filterExpr };
      }

      return filterExpr;
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

  function parseUnaryExpression(): Expression | undefined {
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

  function parseAndExpression(): Expression | undefined {
    const operands: Expression[] = [];

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
  };

  function parseOrExpression(): Expression | undefined {
    const left = parseAndExpression();
    if (!left) {
      return undefined;
    }

    const operands: Expression[] = [left];

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
  };

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
