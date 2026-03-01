import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { describe, expect, test } from 'vitest';
import { buildStorageKey, isStoragePatternValid } from './storage-pattern.usecases';

describe('storage-pattern usecases', () => {
  describe('buildStorageKey', () => {
    const context: StoragePatternInterpolationContext = {
      documentId: 'doc_012345678901234567890123',
      documentName: 'My Document.pdf',
      organizationId: 'org_012345678901234567890123',
      now: new Date('2025-05-15T12:34:56.789Z'),
    };

    describe('given a storage key pattern, returns a function that can interpolate it with a context', () => {
      const patterns = [
        {
          label: 'simple pattern with no transformers',
          storageKeyPattern: '{{organization.id}}/{{document.name}}',
          expected: 'org_012345678901234567890123/My Document.pdf',
        },
        {
          label: 'patterns can have spaces around expressions',
          storageKeyPattern: '{{   organization.id }}/{{document.name  }}',
          expected: 'org_012345678901234567890123/My Document.pdf',
        },
        {
          label: 'pattern with a transformer',
          storageKeyPattern: '{{organization.id}}/{{document.name | uppercase}}',
          expected: 'org_012345678901234567890123/MY DOCUMENT.PDF',
        },
        {
          label: 'transformers can have spaces around them',
          storageKeyPattern: '{{organization.id}}/{{document.name      |      uppercase    }}',
          expected: 'org_012345678901234567890123/MY DOCUMENT.PDF',
        },
        {
          label: 'transformers can have arguments',
          storageKeyPattern: '{{ currentDate | formatDate {yyyy} }}',
          expected: '2025',
        },
        {
          label: 'transformers can end with curly braces if they have arguments',
          storageKeyPattern: '{{currentDate | formatDate {yyyy}-{MM}-{dd}}}',
          expected: '2025-05-15',
        },
        {
          label: 'transformers arguments can use quotes for spaces',
          storageKeyPattern: '{{currentDate | formatDate "{yyyy} {MM} {dd}"}}',
          expected: '2025 05 15',
        },
        {
          label: 'transformers arguments can have escaped quotes',
          storageKeyPattern: '{{currentDate | formatDate "{yyyy} \\"{MM}\\" {dd}"}}',
          expected: '2025 "05" 15',
        },
        {
          label: 'transformers can have multiple arguments',
          storageKeyPattern: '{{document.id | padStart 30 0}}',
          expected: '00doc_012345678901234567890123',
        },
        {
          label: 'transformers multiple arguments can be quoted',
          storageKeyPattern: '{{document.id | padStart "40" "hello \\"world\\""}}',
          expected: 'hello "worlddoc_012345678901234567890123',
        },
        {
          label: 'unclosed quotes are accepted and considered part of the argument',
          storageKeyPattern: '{{currentDate | formatDate "{yyyy} {MM} {dd}}}',
          expected: '2025 05 15',
        },
      ];

      for (const { label, storageKeyPattern, expected: storageKey } of patterns) {
        test(label, () => {
          expect(
            buildStorageKey({ storageKeyPattern, ...context }),
          ).to.eql(
            { storageKey },
          );
        });
      }
    });

    test('unrecognized expressions throw an error', () => {
      expect(
        () => buildStorageKey({ storageKeyPattern: '{{unknown.expression}}/{{document.name}}', ...context }),
      ).to.throw('Unknown expression: unknown.expression');
    });

    test('unrecognized transformers throw an error', () => {
      expect(
        () => buildStorageKey({ storageKeyPattern: '{{document.name | unknownTransformer}}', ...context }),
      ).to.throw('Unknown transformer: unknownTransformer');
    });

    test('transformers without arguments called with arguments are ok', () => {
      expect(
        buildStorageKey({ storageKeyPattern: '{{document.name | uppercase "unexpected argument"}}', ...context }),
      ).to.eql({ storageKey: 'MY DOCUMENT.PDF' });
    });
  });

  describe('isStoragePatternValid', () => {
    test('a pattern is invalid if it contains an unrecognized expression', () => {
      expect(isStoragePatternValid({ storageKeyPattern: '{{unknown.expression}}/{{document.name}}' })).to.eql({ isValid: false, error: new Error('Unknown expression: unknown.expression') });
    });

    test('a pattern is invalid if it contains an unrecognized transformer', () => {
      expect(isStoragePatternValid({ storageKeyPattern: '{{document.name | unknownTransformer}}' })).to.eql({ isValid: false, error: new Error('Unknown transformer: unknownTransformer') });
    });

    test('a pattern is valid if it only contains recognized expressions and transformers', () => {
      expect(isStoragePatternValid({ storageKeyPattern: '{{organization.id}}/{{document.name | uppercase}}' })).to.eql({ isValid: true });
    });

    test('a pattern is invalid if it ends with a slash', () => {
      expect(isStoragePatternValid({ storageKeyPattern: '{{organization.id}}/{{document.name}}/' })).to.eql({ isValid: false, error: new Error('Pattern cannot end with a slash') });
    });
  });
});
