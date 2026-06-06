import { describe, expect, test } from 'vitest';
import { defineTextExtractor } from './extractors.models';
import { extractorDefinitions, getExtractor } from './extractors.registry';

describe('extractors registry', () => {
  describe('getExtractor', () => {
    test('gets the extractor for a given mimeType', () => {
      const extractorDefinitions = [
        defineTextExtractor({ name: '1', mimeTypes: ['a/b'], extract: async () => ({ content: '' }) }),
        defineTextExtractor({ name: '2', mimeTypes: ['a/*'], extract: async () => ({ content: '' }) }),
        defineTextExtractor({ name: '3', mimeTypes: ['c/d'], extract: async () => ({ content: '' }) }),
      ];

      expect(getExtractor({ mimeType: 'a/b', extractors: extractorDefinitions }).extractor?.name).to.eql('1');
      expect(getExtractor({ mimeType: 'a/c', extractors: extractorDefinitions }).extractor?.name).to.eql('2');
      expect(getExtractor({ mimeType: 'e/f', extractors: extractorDefinitions })).to.eql({ extractor: undefined });
    });
  });

  describe('extractorDefinitions', () => {
    describe('non-regs', () => {
      test('all extractors have a unique name', () => {
        const names = extractorDefinitions.map(extractor => extractor.name);

        expect(new Set(names).size).to.eql(names.length, 'All extractors must have a unique name');
      });

      test('all extractors have non empty mimeTypes array', () => {
        extractorDefinitions.forEach((extractor) => {
          expect(Array.isArray(extractor.mimeTypes)).to.eql(true, 'All extractors must have a mimeTypes array');
          expect(extractor.mimeTypes.length).to.be.greaterThan(0, 'All extractors must have at least one mimeType');
        });
      });

      test('all extractors have a unique mimeType', () => {
        const mimeTypes = extractorDefinitions.flatMap(extractor => extractor.mimeTypes);

        expect(new Set(mimeTypes).size).to.eql(mimeTypes.length, 'All extractors must have a unique mimeType');
      });
    });
  });
});
