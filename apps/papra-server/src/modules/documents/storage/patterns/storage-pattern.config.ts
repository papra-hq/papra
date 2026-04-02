import type { AppConfigDefinition } from '../../../config/config.types';
import { booleanishSchema } from '../../../config/config.schemas';
import { coercedPositiveIntegerSchema } from '../../../shared/schemas/number.schemas';
import { storagePatternSchema } from './storage-pattern.schemas';

export const storagePatternConfig = {
  useLegacyStorageKeyDefinitionSystem: {
    doc: 'Whether to use the legacy storage key definition system, which generates storage keys in the format: {{organization.id}}/originals/{{document.id}}. When set to true, no storage key pattern will be used, nor will the incremental suffix or random suffix fallback mechanisms be enabled, as the storage key will be generated using the legacy system.',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENT_STORAGE_USE_LEGACY_STORAGE_KEY_DEFINITION_SYSTEM',
  },
  maxIncrementalSuffixAttempts: {
    doc: 'How many incremental suffixes to try when a storage key is already taken (e.g. file_1.txt, file_2.txt, ...). Set to 0 to skip incremental suffixes entirely.',
    schema: coercedPositiveIntegerSchema,
    default: 9, // This allows for a total of 10 attempts (the initial key + 9 incremental suffixes)
    env: 'DOCUMENT_STORAGE_PATTERN_MAX_INCREMENTAL_SUFFIX_ATTEMPTS',
  },
  enableRandomSuffixFallback: {
    doc: 'Whether to enable a fallback mechanism that adds a random alphanumeric 8-character suffix to the storage key if all incremental suffix attempts are exhausted.',
    schema: booleanishSchema,
    default: true,
    env: 'DOCUMENT_STORAGE_PATTERN_ENABLE_RANDOM_SUFFIX_FALLBACK',
  },
  storageKeyPattern: {
    doc: 'The pattern to use for generating storage keys. This can include expressions enclosed in double curly braces (e.g. {{document.name}}) that will be evaluated at runtime.',
    schema: storagePatternSchema,
    default: '{{organization.id}}/{{document.name}}',
    env: 'DOCUMENT_STORAGE_KEY_PATTERN',
  },
} as const satisfies AppConfigDefinition;
