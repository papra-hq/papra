import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { storagePatternSchema } from './storage-pattern.schemas';

describe('storage-pattern schemas', () => {
  describe('storagePatternSchema', () => {
    test('ensure the storage pattern is valid, it throws if the pattern contains invalid expressions or transformers', () => {
      expect(v.parse(storagePatternSchema, '{{document.id}}')).toBe('{{document.id}}');
      expect(v.parse(storagePatternSchema, '{{document.name | lowercase}}')).toBe('{{document.name | lowercase}}');
      expect(v.parse(storagePatternSchema, 'documents/{{document.id}}')).toBe('documents/{{document.id}}');

      expect(() => v.parse(storagePatternSchema, '{{document}}')).toThrow('Invalid storage pattern: Unknown expression: document');
      expect(() => v.parse(storagePatternSchema, '{{document.name | unknownFilter}}')).toThrow('Invalid storage pattern: Unknown transformer: unknownFilter');
    });
  });
});
