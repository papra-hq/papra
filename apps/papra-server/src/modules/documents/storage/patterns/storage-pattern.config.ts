import type { AppConfigDefinition } from '../../../config/config.types';
import { z } from 'zod';
import { booleanishSchema } from '../../../config/config.schemas';
import { isStoragePatternValid } from './storage-pattern.usecases';

export const storagePatternConfig = {
  useLegacyStorageKeyDefinitionSystem: {
    doc: 'Whether to use the legacy storage key definition system, which generates storage keys in the format: {{organization.id}}/originals/{{document.id}}. When set to true, no storage key pattern will be used, nor will the incremental suffix or random suffix fallback mechanisms be enabled, as the storage key will be generated using the legacy system.',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENT_STORAGE_USE_LEGACY_STORAGE_KEY_DEFINITION_SYSTEM',
    showInDocumentation: false, // TODO: enable when released
  },
  maxIncrementalSuffixAttempts: {
    doc: 'How many incremental suffixes to try when a storage key is already taken (e.g. file_1.txt, file_2.txt, ...). Set to 0 to skip incremental suffixes entirely.',
    schema: z.coerce.number().int().nonnegative(),
    default: 9, // This allows for a total of 10 attempts (the initial key + 9 incremental suffixes)
    env: 'DOCUMENT_STORAGE_PATTERN_MAX_INCREMENTAL_SUFFIX_ATTEMPTS',
    showInDocumentation: false, // TODO: enable when released
  },
  enableRandomSuffixFallback: {
    doc: 'Whether to enable a fallback mechanism that adds a random alphanumeric 8-character suffix to the storage key if all incremental suffix attempts are exhausted.',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENT_STORAGE_PATTERN_ENABLE_RANDOM_SUFFIX_FALLBACK',
    showInDocumentation: false, // TODO: enable when released
  },
  storageKeyPattern: {
    doc: 'The pattern to use for generating storage keys. This can include expressions enclosed in double curly braces (e.g. {{document.name}}) that will be evaluated at runtime.',
    schema: z
      .string()
      .superRefine((storageKeyPattern, ctx) => {
        const result = isStoragePatternValid({ storageKeyPattern });
        if (!result.isValid) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: result.error.message,
          });
        }
      }),
    default: '{{organization.id}}/{{document.name}}',
    env: 'DOCUMENT_STORAGE_KEY_PATTERN',
    showInDocumentation: false, // TODO: enable when released
  },
} as const satisfies AppConfigDefinition;
