import { describe, expect, test } from 'vitest';
import { aiModelAdapterConfigListSchema } from './ai-adapters.schemas';
import * as v from 'valibot';

describe('ai.schemas', () => {
  describe('aiModelAdapterConfigListSchema', () => {
    test('model config ids should be unique', () => {
      expect(() =>
        v.parse(aiModelAdapterConfigListSchema, [
          {
            id: 'model1',
            adapter: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: 'test-api-key',
          },
          {
            id: 'model1', // Duplicate ID
            adapter: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: 'test-api-key',
          },
        ]),
      ).toThrow(
        'Duplicate AI model adapter IDs are not allowed. Make sure each adapter configuration has a unique "id" field.',
      );

      expect(
        v.parse(aiModelAdapterConfigListSchema, [
          {
            id: 'model1',
            adapter: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: 'test-api-key',
          },
          {
            id: 'model2', // Unique ID
            adapter: 'openai-compatible',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: 'test-api-key',
          },
        ]),
      ).toEqual([
        {
          id: 'model1',
          adapter: 'openai-compatible',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'test-api-key',
        },
        {
          id: 'model2',
          adapter: 'openai-compatible',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'test-api-key',
        },
      ]);
    });

    test('empty list should be valid', () => {
      expect(v.parse(aiModelAdapterConfigListSchema, [])).toEqual([]);
    });
  });
});
