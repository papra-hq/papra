import type { Issue, Operator } from './parser.types';
import { ERROR_CODES } from './errors';

export type Token
  = | { type: 'LPAREN' }
    | { type: 'RPAREN' }
    | { type: 'AND' }
    | { type: 'OR' }
    | { type: 'NOT' }
    | { type: 'FILTER'; field: string; operator: Operator; value: string; negated: boolean }
    | { type: 'TEXT'; value: string }
    | { type: 'EOF' };

export type TokenizeResult = {
  tokens: Token[];
  issues: Issue[];
};

export function tokenize({ query, maxTokens }: { query: string; maxTokens: number }): TokenizeResult {
  const tokens: Token[] = [];
  const issues: Issue[] = [];
  let pos = 0;

  const peek = (): string | undefined => query[pos];
  const advance = (): string => query[pos++] || '';

  const skipWhitespace = (): void => {
    while (pos < query.length) {
      const char = query[pos];
      if (!char || !/\s/.test(char)) {
        break;
      }
      pos++;
    }
  };

  const readQuotedString = (): string | undefined => {
    if (peek() !== '"') {
      return undefined;
    }

    advance(); // Skip opening quote
    let value = '';
    let escaped = false;

    while (pos < query.length) {
      const char = peek();

      if (!char) {
        break;
      }

      if (escaped) {
        value += char;
        escaped = false;
        advance();
      } else if (char === '\\') {
        escaped = true;
        advance();
      } else if (char === '"') {
        advance(); // Skip closing quote
        return value;
      } else {
        value += char;
        advance();
      }
    }

    issues.push({
      code: ERROR_CODES.UNCLOSED_QUOTED_STRING,
      message: 'Unclosed quoted string',
    });
    return value;
  };

  const readUnquotedToken = (stopAtQuote = false): string => {
    let value = '';

    while (pos < query.length) {
      const char = peek();

      if (!char || /\s/.test(char) || char === '(' || char === ')') {
        break;
      }

      // Stop at quote if requested (for filter field names before quoted values)
      if (stopAtQuote && char === '"') {
        break;
      }

      // Keep backslashes in unquoted tokens so parseFilter can detect escaped colons
      value += advance();
    }

    return value;
  };

  const readFilterValue = (): string => {
    skipWhitespace();

    // Check if value is quoted
    const quotedValue = readQuotedString();
    if (quotedValue !== undefined) {
      return quotedValue;
    }

    // Read unquoted value (up to whitespace or special chars)
    let value = '';
    while (pos < query.length) {
      const char = peek();

      if (!char || /\s/.test(char) || char === '(' || char === ')') {
        break;
      }

      if (char === '\\') {
        advance();
        if (pos < query.length) {
          value += advance();
        }
      } else {
        value += advance();
      }
    }

    return value.replace(/\\:/g, ':');
  };

  const hasUnescapedColon = (str: string): boolean => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === ':' && (i === 0 || str[i - 1] !== '\\')) {
        return true;
      }
    }
    return false;
  };

  const parseFilter = (token: string, negated: boolean): Token | undefined => {
    // Check for unescaped colons
    if (!hasUnescapedColon(token)) {
      return undefined;
    }

    // Find first unescaped colon
    let firstColonIndex = -1;
    for (let i = 0; i < token.length; i++) {
      if (token[i] === ':' && (i === 0 || token[i - 1] !== '\\')) {
        firstColonIndex = i;
        break;
      }
    }

    if (firstColonIndex === -1) {
      return undefined;
    }

    const field = token.slice(0, firstColonIndex).replace(/\\:/g, ':');
    const afterColon = token.slice(firstColonIndex + 1);

    // Check for operator at the start
    let operator: Operator = '=';
    let operatorLength = 0;

    if (afterColon.startsWith('>=')) {
      operator = '>=';
      operatorLength = 2;
    } else if (afterColon.startsWith('<=')) {
      operator = '<=';
      operatorLength = 2;
    } else if (afterColon.startsWith('>')) {
      operator = '>';
      operatorLength = 1;
    } else if (afterColon.startsWith('<')) {
      operator = '<';
      operatorLength = 1;
    } else if (afterColon.startsWith('=')) {
      operator = '=';
      operatorLength = 1;
    }

    // If there's nothing after the operator in the token, read the value from input
    let value = afterColon.slice(operatorLength).replace(/\\:/g, ':');

    // If the value is empty and we still have input, this might be a case like "tag:" followed by a quoted string
    if (!value) {
      value = readFilterValue();
    }

    return { type: 'FILTER', field, operator, value, negated };
  };

  while (pos < query.length) {
    if (tokens.length >= maxTokens) {
      issues.push({
        code: ERROR_CODES.MAX_TOKENS_EXCEEDED,
        message: `Maximum token limit of ${maxTokens} exceeded`,
      });
      break;
    }

    skipWhitespace();

    if (pos >= query.length) {
      break;
    }

    const char = peek();

    // Handle parentheses
    if (char === '(') {
      advance();
      tokens.push({ type: 'LPAREN' });
      continue;
    }

    if (char === ')') {
      advance();
      tokens.push({ type: 'RPAREN' });
      continue;
    }

    // Handle negation prefix
    const nextChar = query[pos + 1];
    if (char === '-' && nextChar && !/\s/.test(nextChar)) {
      advance();
      skipWhitespace();

      // Read the next token (could be quoted or unquoted)
      const quotedValue = readQuotedString();
      const token = quotedValue !== undefined ? quotedValue : readUnquotedToken();

      // Try to parse as filter
      const filter = parseFilter(token, true);
      if (filter) {
        tokens.push(filter);
      } else {
        // If not a filter, treat as negated text search (which we'll handle as NOT operator)
        const unescapedText = token.replace(/\\(.)/g, '$1');
        tokens.push({ type: 'NOT' });
        tokens.push({ type: 'TEXT', value: unescapedText });
      }
      continue;
    }

    // Read quoted or unquoted token
    const quotedValue = readQuotedString();
    const token = quotedValue !== undefined ? quotedValue : readUnquotedToken(true);

    if (!token) {
      advance(); // Skip invalid character
      continue;
    }

    // Check for operators
    const upperToken = token.toUpperCase();
    if (upperToken === 'AND') {
      tokens.push({ type: 'AND' });
      continue;
    }

    if (upperToken === 'OR') {
      tokens.push({ type: 'OR' });
      continue;
    }

    if (upperToken === 'NOT') {
      tokens.push({ type: 'NOT' });
      continue;
    }

    // Try to parse as filter (only if not quoted)
    if (quotedValue === undefined) {
      const filter = parseFilter(token, false);
      if (filter) {
        tokens.push(filter);
        continue;
      }
    }

    // Otherwise, treat as text (unescape backslashes)
    const unescapedText = token.replace(/\\(.)/g, '$1');
    tokens.push({ type: 'TEXT', value: unescapedText });
  }

  tokens.push({ type: 'EOF' });

  return { tokens, issues };
}
