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
        {
          query: `"foo bar":buz`,
          expectedTokens: [
            { type: 'FILTER', field: 'foo bar', operator: '=', value: 'buz' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"foo bar":"hello world"`,
          expectedTokens: [
            { type: 'FILTER', field: 'foo bar', operator: '=', value: 'hello world' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"my field":>=42`,
          expectedTokens: [
            { type: 'FILTER', field: 'my field', operator: '>=', value: '42' },
            { type: 'EOF' },
          ],
        },
        {
          query: `-"foo bar":buz`,
          expectedTokens: [
            { type: 'NOT' },
            { type: 'FILTER', field: 'foo bar', operator: '=', value: 'buz' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"foo \\"bar\\"":buz`,
          expectedTokens: [
            { type: 'FILTER', field: 'foo "bar"', operator: '=', value: 'buz' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"AND"`,
          expectedTokens: [
            { type: 'TEXT', value: 'AND' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"OR"`,
          expectedTokens: [
            { type: 'TEXT', value: 'OR' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"NOT"`,
          expectedTokens: [
            { type: 'TEXT', value: 'NOT' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"or":foo`,
          expectedTokens: [
            { type: 'FILTER', field: 'or', operator: '=', value: 'foo' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"NOT":value`,
          expectedTokens: [
            { type: 'FILTER', field: 'NOT', operator: '=', value: 'value' },
            { type: 'EOF' },
          ],
        },
        {
          query: `"AND":>=42`,
          expectedTokens: [
            { type: 'FILTER', field: 'AND', operator: '>=', value: '42' },
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
