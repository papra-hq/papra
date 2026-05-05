import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { BATCH_MAX_DOCUMENTS, BATCH_MAX_TAGS_PER_REQUEST } from './documents-batch.constants';
import { batchTagsBodySchema, batchTrashBodySchema } from './documents-batch.schemas';

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

  describe('batchTagsBodySchema', () => {
    const documentsFilter = { documentIds: ['doc_aaaaaaaaaaaaaaaaaaaaaaaa'] };

    test('parses a body with addTagIds only', () => {
      expect(v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
      })).toEqual({
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        removeTagIds: [],
      });
    });

    test('parses a body with removeTagIds only', () => {
      expect(v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        removeTagIds: ['tag_bbbbbbbbbbbbbbbbbbbbbbbb'],
      })).toEqual({
        filter: documentsFilter,
        addTagIds: [],
        removeTagIds: ['tag_bbbbbbbbbbbbbbbbbbbbbbbb'],
      });
    });

    test('parses a body with both addTagIds and removeTagIds', () => {
      expect(v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        removeTagIds: ['tag_bbbbbbbbbbbbbbbbbbbbbbbb'],
      })).toEqual({
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        removeTagIds: ['tag_bbbbbbbbbbbbbbbbbbbbbbbb'],
      });
    });

    test('accepts a query filter', () => {
      expect(v.parse(batchTagsBodySchema, {
        filter: { query: 'invoice' },
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
      })).toEqual({
        filter: { query: 'invoice' },
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        removeTagIds: [],
      });
    });

    test('rejects when both addTagIds and removeTagIds are omitted', () => {
      expect(() => v.parse(batchTagsBodySchema, { filter: documentsFilter })).toThrow();
    });

    test('rejects when both addTagIds and removeTagIds are empty', () => {
      expect(() => v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: [],
        removeTagIds: [],
      })).toThrow();
    });

    test('rejects when addTagIds and removeTagIds overlap', () => {
      expect(() => v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        removeTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
      })).toThrow();
    });

    test('rejects an invalid tag id', () => {
      expect(() => v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: ['not-a-tag-id'],
      })).toThrow();
    });

    test(`rejects more than ${BATCH_MAX_TAGS_PER_REQUEST} addTagIds`, () => {
      const tooMany = Array.from({ length: BATCH_MAX_TAGS_PER_REQUEST + 1 }).map((_, i) => `tag_${i.toString().padStart(24, '0')}`);
      expect(() => v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: tooMany,
      })).toThrow();
    });

    test('rejects unknown top-level keys', () => {
      expect(() => v.parse(batchTagsBodySchema, {
        filter: documentsFilter,
        addTagIds: ['tag_aaaaaaaaaaaaaaaaaaaaaaaa'],
        unexpected: true,
      })).toThrow();
    });
  });
});
