import { describe, expect, test } from 'vitest';
import { tokenize } from './tokenizer';

describe('tokenizer', () => {
  describe('tokenize', () => {
    describe('tokenizes queries', () => {
      const queries: { query: string; expectedTokens: unknown[]; maxTokens?: number }[] = [
        {
          query: 'foobar',
          expectedTokens: [
            { type: 'TEXT', value: 'foobar' },
            { type: 'EOF' },
          ],
        },
        {
          query: '-foobar',
          expectedTokens: [
            { type: 'NOT' },
            { type: 'TEXT', value: 'foobar' },
            { type: 'EOF' },
          ],
        },
        {
          query: 'status:open AND priority:high',
          expectedTokens: [
            { type: 'FILTER', field: 'status', operator: '=', value: 'open', negated: false },
            { type: 'AND' },
            { type: 'FILTER', field: 'priority', operator: '=', value: 'high', negated: false },
            { type: 'EOF' },
          ],
        },
        {
          query: `type:feature AND (status:open OR (priority:high -tag:"full review")) "user feedback"`,
          expectedTokens: [
            { type: 'FILTER', field: 'type', operator: '=', value: 'feature', negated: false },
            { type: 'AND' },
            { type: 'LPAREN' },
            { type: 'FILTER', field: 'status', operator: '=', value: 'open', negated: false },
            { type: 'OR' },
            { type: 'LPAREN' },
            { type: 'FILTER', field: 'priority', operator: '=', value: 'high', negated: false },
            { type: 'FILTER', field: 'tag', operator: '=', value: 'full review', negated: true },
            { type: 'RPAREN' },
            { type: 'RPAREN' },
            { type: 'TEXT', value: 'user feedback' },
            { type: 'EOF' },
          ],
        },
      ];

      for (const { query, expectedTokens, maxTokens = 100 } of queries) {
        test(`tokenizes "${query}"`, () => {
          const result = tokenize({ query, maxTokens });
          expect(result.tokens).to.eql(expectedTokens);
        });
      }
    });
  });
});
