import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { BATCH_MAX_DOCUMENTS } from './documents-batch.constants';
import { batchTrashBodySchema } from './documents-batch.schemas';

describe('documents-batch.schemas', () => {
  describe('batchTrashBodySchema', () => {
    test('parses a body with documentIds filter', () => {
      const result = v.parse(batchTrashBodySchema, {
        filter: { documentIds: ['doc_aaaaaaaaaaaaaaaaaaaaaaaa', 'doc_bbbbbbbbbbbbbbbbbbbbbbbb'] },
      });

      expect(result).toEqual({
        filter: { documentIds: ['doc_aaaaaaaaaaaaaaaaaaaaaaaa', 'doc_bbbbbbbbbbbbbbbbbbbbbbbb'] },
      });
    });

    test('parses a body with query filter', () => {
      const result = v.parse(batchTrashBodySchema, {
        filter: { query: 'tag:invoice foo bar' },
      });

      expect(result).toEqual({ filter: { query: 'tag:invoice foo bar' } });
    });

    test('rejects a body without filter', () => {
      expect(() => v.parse(batchTrashBodySchema, {})).toThrow();
    });

    test('rejects a body with both documentIds and query (strict union)', () => {
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { documentIds: ['doc_aaaaaaaaaaaaaaaaaaaaaaaa'], query: 'foo' },
      })).toThrow();
    });

    test('rejects an empty documentIds array', () => {
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { documentIds: [] },
      })).toThrow();
    });

    test(`rejects more than ${BATCH_MAX_DOCUMENTS} document ids`, () => {
      const tooMany = Array.from({ length: BATCH_MAX_DOCUMENTS + 1 }).map((_, i) => `doc_${i.toString().padStart(24, '0')}`);
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { documentIds: tooMany },
      })).toThrow();
    });

    test('rejects an invalid document id', () => {
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { documentIds: ['not-a-doc-id'] },
      })).toThrow();
    });

    test('an empty query is allowed', () => {
      expect(v.parse(batchTrashBodySchema, {
        filter: { query: '' },
      })).toEqual({ filter: { query: '' } });
    });

    test(`rejects a query longer than 1024 characters`, () => {
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { query: 'a'.repeat(1025) },
      })).toThrow();
    });

    test('rejects unknown top-level keys', () => {
      expect(() => v.parse(batchTrashBodySchema, {
        filter: { documentIds: ['doc_aaaaaaaaaaaaaaaaaaaaaaaa'] },
        unexpected: true,
      })).toThrow();
    });
  });
});
