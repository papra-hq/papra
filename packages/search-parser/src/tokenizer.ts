import type { Issue, Operator } from './parser.types';
import { ERROR_CODES } from './errors';
import { isWhitespace } from './string';

export type Token
  = | { type: 'LPAREN' }
    | { type: 'RPAREN' }
    | { type: 'AND' }
    | { type: 'OR' }
    | { type: 'NOT' }
    | { type: 'FILTER'; field: string; operator: Operator; value: string }
    | { type: 'TEXT'; value: string }
    | { type: 'EOF' };

export type TokenizeResult = {
  tokens: Token[];
  issues: Issue[];
};

// Unified escape handling utilities
const unescapeBackslashes = (str: string): string => str.replace(/\\(.)/g, '$1');
const unescapeColons = (str: string): string => str.replace(/\\:/g, ':');

type StopCondition = (char: string) => boolean;

function isWhitespaceOrParen(char: string): boolean {
  return isWhitespace(char) || char === '(' || char === ')';
}

export function tokenize({ query, maxTokens }: { query: string; maxTokens: number }): TokenizeResult {
  const tokens: Token[] = [];
  const issues: Issue[] = [];
  let pos = 0;

  const peek = (): string | undefined => query[pos];
  const advance = (): string => query[pos++] || '';

  const skipWhitespace = (): void => {
    while (pos < query.length) {
      const char = query[pos];
      if (!char || !isWhitespace(char)) {
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

  // Unified function to read unquoted values with configurable stop conditions and escape handling
  const readUnquotedValue = ({
    stopCondition,
    processEscapes,
    stopAtQuote = false,
  }: {
    stopCondition: StopCondition;
    processEscapes: boolean;
    stopAtQuote?: boolean;
  }): string => {
    let value = '';

    while (pos < query.length) {
      const char = peek();

      if (!char || stopCondition(char)) {
        break;
      }

      if (stopAtQuote && char === '"') {
        break;
      }

      if (processEscapes && char === '\\') {
        advance();
        if (pos < query.length) {
          value += advance();
        }
      } else {
        value += advance();
      }
    }

    return value;
  };

  const readUnquotedToken = (): string => {
    // Keep backslashes in unquoted tokens so parseFilter can detect escaped colons
    return readUnquotedValue({
      stopCondition: isWhitespaceOrParen,
      processEscapes: false,
      stopAtQuote: true,
    });
  };

  const readFilterValue = (): string => {
    skipWhitespace();

    // Check if value is quoted
    const quotedValue = readQuotedString();
    if (quotedValue !== undefined) {
      return quotedValue;
    }

    // Read unquoted value with escape processing, then unescape colons
    const value = readUnquotedValue({
      stopCondition: isWhitespaceOrParen,
      processEscapes: true,
    });

    return unescapeColons(value);
  };

  const hasUnescapedColon = (str: string): boolean => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === ':' && (i === 0 || str[i - 1] !== '\\')) {
        return true;
      }
    }
    return false;
  };

  const parseFilter = (token: string): Token | undefined => {
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

    const field = unescapeColons(token.slice(0, firstColonIndex));
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
    let value = unescapeColons(afterColon.slice(operatorLength));

    // If the value is empty and we still have input, this might be a case like "tag:" followed by a quoted string
    if (!value) {
      value = readFilterValue();
    }

    return { type: 'FILTER', field, operator, value };
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
    if (char === '-' && nextChar && !isWhitespace(nextChar)) {
      advance();
      skipWhitespace();

      // Read the next token (could be quoted or unquoted)
      const quotedValue = readQuotedString();
      const token = quotedValue !== undefined ? quotedValue : readUnquotedToken();

      // Try to parse as filter
      const filter = parseFilter(token);
      if (filter) {
        tokens.push({ type: 'NOT' });
        tokens.push(filter);
      } else {
        // If not a filter, treat as negated text search
        tokens.push({ type: 'NOT' });
        tokens.push({ type: 'TEXT', value: unescapeBackslashes(token) });
      }
      continue;
    }

    // Read quoted or unquoted token
    const quotedValue = readQuotedString();
    const token = quotedValue !== undefined ? quotedValue : readUnquotedToken();

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
      const filter = parseFilter(token);
      if (filter) {
        tokens.push(filter);
        continue;
      }
    }

    // Otherwise, treat as text (unescape backslashes)
    tokens.push({ type: 'TEXT', value: unescapeBackslashes(token) });
  }

  tokens.push({ type: 'EOF' });

  return { tokens, issues };
}
