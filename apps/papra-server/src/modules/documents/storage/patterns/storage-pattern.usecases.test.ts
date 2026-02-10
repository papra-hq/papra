import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { describe, expect, test } from 'vitest';
import { buildStoragePath } from './storage-pattern.usecases';

describe('storage-pattern usecases', () => {
  describe('buildStoragePath', () => {
    const context: StoragePatternInterpolationContext = {
      document: {
        id: 'doc_012345678901234567890123',
        name: 'My Document.pdf',
        createdAt: new Date('2025-05-15T10:30:45.123Z'),
      },
      organization: {
        id: 'org_012345678901234567890123',
      },
      now: new Date('2026-02-06T14:45:12.456Z'),
    };

    describe('given a storage path pattern, returns a function that can interpolate it with a context', () => {
      const patterns = [
        {
          label: 'simple pattern with no transformers',
          pattern: '{{organization.id}}/{{document.name}}',
          expected: 'org_012345678901234567890123/My Document.pdf',
        },
        {
          label: 'patterns can have spaces around expressions',
          pattern: '{{   organization.id }}/{{document.name  }}',
          expected: 'org_012345678901234567890123/My Document.pdf',
        },
        {
          label: 'pattern with a transformer',
          pattern: '{{organization.id}}/{{document.name | uppercase}}',
          expected: 'org_012345678901234567890123/MY DOCUMENT.PDF',
        },
        {
          label: 'transformers can have spaces around them',
          pattern: '{{organization.id}}/{{document.name      |      uppercase    }}',
          expected: 'org_012345678901234567890123/MY DOCUMENT.PDF',
        },
        {
          label: 'transformers can have arguments',
          pattern: '{{ document.createdAt | formatDate {yyyy} }}',
          expected: '2025',
        },
        {
          label: 'transformers can end with curly braces if they have arguments',
          pattern: '{{document.createdAt | formatDate {yyyy}-{MM}-{dd}}}',
          expected: '2025-05-15',
        },
        {
          label: 'transformers arguments can quotes for spaces',
          pattern: '{{document.createdAt | formatDate "{yyyy} {MM} {dd}"}}',
          expected: '2025 05 15',
        },
        {
          label: 'transformers arguments can have escaped quotes',
          pattern: '{{document.createdAt | formatDate "{yyyy} \\"{MM}\\" {dd}"}}',
          expected: '2025 "05" 15',
        },
        {
          label: 'transformers can have multiple arguments',
          pattern: '{{document.id | padStart 30 0}}',
          expected: '00doc_012345678901234567890123',
        },
        {
          label: 'transformers multiple arguments can be quoted',
          pattern: '{{document.id | padStart "40" "hello \\"world\\""}}',
          expected: 'hello "worlddoc_012345678901234567890123',
        },
        {
          label: 'unrecognized expressions are left as-is',
          pattern: '{{unknown.expression}}/{{ unknown.expression  }}/{{document.name}}',
          expected: '{{unknown.expression}}/{{ unknown.expression  }}/My Document.pdf',
        },
        {
          label: 'unrecognized transformers are ignored',
          pattern: '{{document.name | unknownTransformer}}',
          expected: 'My Document.pdf',
        },
      ];

      for (const { label, pattern, expected: storagePath } of patterns) {
        test(label, () => {
          expect(
            buildStoragePath({ pattern, context }),
          ).to.eql(
            { storagePath },
          );
        });
      }
    });
  });
});
