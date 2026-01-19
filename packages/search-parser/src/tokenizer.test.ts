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
            { type: 'FILTER', field: 'status', operator: '=', value: 'open' },
            { type: 'AND' },
            { type: 'FILTER', field: 'priority', operator: '=', value: 'high' },
            { type: 'EOF' },
          ],
        },
        {
          query: `type:feature AND (status:open OR (priority:high -tag:"full review")) "user feedback"`,
          expectedTokens: [
            { type: 'FILTER', field: 'type', operator: '=', value: 'feature' },
            { type: 'AND' },
            { type: 'LPAREN' },
            { type: 'FILTER', field: 'status', operator: '=', value: 'open' },
            { type: 'OR' },
            { type: 'LPAREN' },
            { type: 'FILTER', field: 'priority', operator: '=', value: 'high' },
            { type: 'NOT' },
            { type: 'FILTER', field: 'tag', operator: '=', value: 'full review' },
            { type: 'RPAREN' },
            { type: 'RPAREN' },
            { type: 'TEXT', value: 'user feedback' },
            { type: 'EOF' },
          ],
        },
        {
          query: `tag:bug\\:critical`,
          expectedTokens: [
            { type: 'FILTER', field: 'tag', operator: '=', value: 'bug:critical' },
            { type: 'EOF' },
          ],
        },
        {
          query: `tag:-important tag:"-important" tag:\\-important`,
          expectedTokens: [
            { type: 'FILTER', field: 'tag', operator: '=', value: '-important' },
            { type: 'FILTER', field: 'tag', operator: '=', value: '-important' },
            { type: 'FILTER', field: 'tag', operator: '=', value: '\\-important' },
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
