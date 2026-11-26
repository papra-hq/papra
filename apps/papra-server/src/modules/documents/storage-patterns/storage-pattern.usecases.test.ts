import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createOrganizationNotFoundError } from '../../organizations/organizations.errors';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import {
  buildResolveStoragePatternContext,
  buildStorageKey,
  isStoragePatternValid,
} from './storage-pattern.usecases';

describe('storage-pattern usecases', () => {
  const context: StoragePatternInterpolationContext = {
    documentId: 'doc_012345678901234567890123',
    documentName: 'My Document.pdf',
    documentDate: new Date('2024-03-12T00:00:00.000Z'),
    documentCreatedAt: new Date('2025-01-02T10:20:30.456Z'),
    organizationId: 'org_012345678901234567890123',
    now: new Date('2025-05-15T12:34:56.789Z'),
  };

  describe('resolveStoragePatternContext', () => {
    test('patterns without an organization name expression need no organization lookup', async () => {
      const resolveContext = buildResolveStoragePatternContext({
        organizationsRepository: {
          getOrganizationById: async () => {
            throw new Error('Unexpected organization lookup');
          },
        },
      });

      const storageKeyPattern =
        'organization.name/{{organization.id}}/{{document.name | default "organization.name"}}';
      const resolvedContext = await resolveContext({ storageKeyPattern, ...context });

      expect(resolvedContext).toEqual(context);
      expect(buildStorageKey({ storageKeyPattern, ...resolvedContext })).toEqual({
        storageKey: 'organization.name/org_012345678901234567890123/My Document.pdf',
      });
    });

    test('repeated organization name expressions share one lookup and use the requested organization', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'other-org', name: 'Other Organization' },
          { id: context.organizationId, name: 'Acme/Finance' },
        ],
      });
      const organizationsRepository = createOrganizationsRepository({ db });
      const organizationIds: string[] = [];
      const resolveContext = buildResolveStoragePatternContext({
        organizationsRepository: {
          getOrganizationById: async (args) => {
            organizationIds.push(args.organizationId);
            return organizationsRepository.getOrganizationById(args);
          },
        },
      });
      const storageKeyPattern =
        '{{ organization.name | lowercase }}/{{organization.name}}/{{document.name}}';

      const resolvedContext = await resolveContext({ storageKeyPattern, ...context });

      expect(organizationIds).toEqual([context.organizationId]);
      expect(buildStorageKey({ storageKeyPattern, ...resolvedContext })).toEqual({
        storageKey: 'acme_finance/Acme_Finance/My Document.pdf',
      });
    });

    test('a missing organization fails resolution even when the expression has a default', async () => {
      const resolveContext = buildResolveStoragePatternContext({
        organizationsRepository: {
          getOrganizationById: async () => ({ organization: undefined }),
        },
      });

      await expect(
        resolveContext({
          ...context,
          storageKeyPattern: '{{organization.name | default "unknown"}}/{{document.name}}',
        }),
      ).rejects.toThrow(createOrganizationNotFoundError());
    });

    test('organization lookup failures are propagated', async () => {
      const resolveContext = buildResolveStoragePatternContext({
        organizationsRepository: {
          getOrganizationById: async () => {
            throw new Error('Database unavailable');
          },
        },
      });

      await expect(
        resolveContext({
          ...context,
          storageKeyPattern: '{{organization.name}}/{{document.name}}',
        }),
      ).rejects.toThrow('Database unavailable');
    });
  });

  describe('buildStorageKey', () => {
    test('organization names are sanitized as a single path component before transformers', () => {
      expect(
        buildStorageKey({
          ...context,
          organizationName: '../Acme\\Finance:Team',
          storageKeyPattern: '{{organization.name | uppercase}}/{{document.name}}',
        }),
      ).toEqual({ storageKey: '_ACME_FINANCE_TEAM/My Document.pdf' });
    });

    test('a missing organization name cannot silently become an undefined path component', () => {
      expect(() =>
        buildStorageKey({
          ...context,
          storageKeyPattern: '{{organization.name}}/{{document.name}}',
        }),
      ).toThrow('Expression resolved to an empty value');
    });

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
          expect(buildStorageKey({ storageKeyPattern, ...context })).to.eql({ storageKey });
        });
      }
    });

    test('document dates resolve to their ISO timestamps independently of the current date', () => {
      expect(
        buildStorageKey({
          ...context,
          storageKeyPattern: '{{document.date}}/{{document.createdAt}}',
        }),
      ).toEqual({ storageKey: '2024-03-12T00:00:00.000Z/2025-01-02T10:20:30.456Z' });
    });

    test('document dates support date formatting', () => {
      expect(
        buildStorageKey({
          ...context,
          storageKeyPattern:
            '{{document.date | formatDate "{yyyy}/{MM}"}}/{{document.createdAt | formatDate}}',
        }),
      ).toEqual({ storageKey: '2024/03/2025-01-02' });
    });

    test('an unset document date falls back to no-date with or without date formatting', () => {
      expect(
        buildStorageKey({
          ...context,
          documentDate: null,
          storageKeyPattern: '{{document.date}}/{{document.date | formatDate "{yyyy}/{MM}"}}',
        }),
      ).toEqual({ storageKey: 'no-date/no-date' });
    });

    test('a custom default overrides the missing document date fallback', () => {
      expect(
        buildStorageKey({
          ...context,
          documentDate: null,
          storageKeyPattern: '{{document.date | formatDate | default "undated" | uppercase}}',
        }),
      ).toEqual({ storageKey: 'UNDATED' });
    });

    test('unrecognized expressions throw an error', () => {
      expect(() =>
        buildStorageKey({
          storageKeyPattern: '{{unknown.expression}}/{{document.name}}',
          ...context,
        }),
      ).to.throw('Unknown expression: unknown.expression');
    });

    test('unrecognized transformers throw an error', () => {
      expect(() =>
        buildStorageKey({
          storageKeyPattern: '{{document.name | unknownTransformer}}',
          ...context,
        }),
      ).to.throw('Unknown transformer: unknownTransformer');
    });

    test('default preserves a present document name in a storage key', () => {
      expect(
        buildStorageKey({
          storageKeyPattern:
            '{{organization.id}}/{{document.name | default "unnamed document" | uppercase}}',
          ...context,
        }),
      ).toEqual({ storageKey: 'org_012345678901234567890123/MY DOCUMENT.PDF' });
    });

    test('transformers without arguments called with arguments are ok', () => {
      expect(
        buildStorageKey({
          storageKeyPattern: '{{document.name | uppercase "unexpected argument"}}',
          ...context,
        }),
      ).to.eql({ storageKey: 'MY DOCUMENT.PDF' });
    });
  });

  describe('isStoragePatternValid', () => {
    test('organization name expressions with transformers are valid without a database', () => {
      expect(
        isStoragePatternValid({
          storageKeyPattern: '{{organization.name | lowercase}}/{{document.name}}',
        }),
      ).toEqual({ isValid: true });
    });

    test('document date and creation date expressions with formatting are valid', () => {
      expect(
        isStoragePatternValid({
          storageKeyPattern:
            '{{document.date | formatDate "{yyyy}"}}/{{document.createdAt | formatDate}}/{{document.name}}',
        }),
      ).toEqual({ isValid: true });
    });

    test('a pattern with a default argument is valid', () => {
      expect(
        isStoragePatternValid({
          storageKeyPattern: '{{document.name | default "unnamed document"}}',
        }),
      ).toEqual({ isValid: true });
    });

    test('a default without an argument is rejected even when the expression has a value', () => {
      expect(isStoragePatternValid({ storageKeyPattern: '{{document.name | default}}' })).toEqual({
        isValid: false,
        error: new Error('The default transformer requires a non-empty fallback argument'),
      });
    });

    test('an empty default argument is rejected', () => {
      expect(
        isStoragePatternValid({ storageKeyPattern: '{{document.name | default ""}}' }),
      ).toEqual({
        isValid: false,
        error: new Error('The default transformer requires a non-empty fallback argument'),
      });
    });

    test('a pattern is invalid if it contains an unrecognized expression', () => {
      expect(
        isStoragePatternValid({ storageKeyPattern: '{{unknown.expression}}/{{document.name}}' }),
      ).to.eql({ isValid: false, error: new Error('Unknown expression: unknown.expression') });
    });

    test('a pattern is invalid if it contains an unrecognized transformer', () => {
      expect(
        isStoragePatternValid({ storageKeyPattern: '{{document.name | unknownTransformer}}' }),
      ).to.eql({ isValid: false, error: new Error('Unknown transformer: unknownTransformer') });
    });

    test('a pattern is valid if it only contains recognized expressions and transformers', () => {
      expect(
        isStoragePatternValid({
          storageKeyPattern: '{{organization.id}}/{{document.name | uppercase}}',
        }),
      ).to.eql({ isValid: true });
    });

    test('a pattern is invalid if it ends with a slash', () => {
      expect(
        isStoragePatternValid({ storageKeyPattern: '{{organization.id}}/{{document.name}}/' }),
      ).to.eql({ isValid: false, error: new Error('Pattern cannot end with a slash') });
    });
  });
});
