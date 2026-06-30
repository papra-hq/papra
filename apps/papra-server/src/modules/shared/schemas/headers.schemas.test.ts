import { describe, expect, test } from 'vitest';
import { headersDefinitionStringSchema } from './headers.schemas';
import * as v from 'valibot';

describe('headers.schemas', () => {
  describe('headersDefinitionStringSchema', () => {
    test('parses a valid JSON string into a record of string to string', () => {
      const input = '{"Content-Type": "application/json", "Authorization": "Bearer mytoken"}';
      const result = v.parse(headersDefinitionStringSchema, input);
      expect(result).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mytoken',
      });
    });

    test('throws an error for an invalid JSON string', () => {
      expect(() => v.parse(headersDefinitionStringSchema, 'foo')).toThrow();
    });
  });
});
