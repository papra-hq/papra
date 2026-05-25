import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { updateDocumentBodySchema } from './documents.schemas';

describe('documents.schemas', () => {
  describe('updateDocumentBodySchema', () => {
    test('parses a body with only name', () => {
      expect(v.parse(updateDocumentBodySchema, { name: 'My Document' })).toEqual({ name: 'My Document', content: undefined, documentDate: undefined });
    });

    test('parses a body with only content', () => {
      expect(v.parse(updateDocumentBodySchema, { content: 'Some content' })).toEqual({ name: undefined, content: 'Some content', documentDate: undefined });
    });

    test('parses a body with only documentDate as an ISO string', () => {
      const result = v.parse(updateDocumentBodySchema, { documentDate: '2025-01-01T00:00:00.000Z' });
      expect(result.documentDate).toBeInstanceOf(Date);
      expect(result.documentDate?.getTime()).toBe(new Date('2025-01-01T00:00:00.000Z').getTime());
    });

    test('parses a body with documentDate as null', () => {
      const result = v.parse(updateDocumentBodySchema, { documentDate: null });
      expect(result.documentDate).toBeNull();
    });

    test('parses a body with all fields', () => {
      const result = v.parse(updateDocumentBodySchema, { name: 'My Document', content: 'Some content', documentDate: '2025-06-15T12:00:00.000Z' });
      expect(result.name).toBe('My Document');
      expect(result.content).toBe('Some content');
      expect(result.documentDate).toBeInstanceOf(Date);
    });

    test('fails if no field is provided', () => {
      expect(() => v.parse(updateDocumentBodySchema, {})).toThrow();
    });

    test('fails if name is an empty string', () => {
      expect(() => v.parse(updateDocumentBodySchema, { name: '' })).toThrow();
    });

    test('fails if name exceeds 255 characters', () => {
      expect(() => v.parse(updateDocumentBodySchema, { name: 'a'.repeat(256) })).toThrow();
    });

    test('fails if documentDate is an invalid date string', () => {
      expect(() => v.parse(updateDocumentBodySchema, { documentDate: 'not-a-date' })).toThrow();
    });

    test('fails if an unknown property is present', () => {
      expect(() => v.parse(updateDocumentBodySchema, { name: 'My Document', unknown: 'field' })).toThrow();
    });
  });
});
