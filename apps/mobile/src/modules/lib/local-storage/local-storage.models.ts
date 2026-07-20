import {
  STORAGE_KEY_BASE_PREFIX,
  STORAGE_KEY_SECTION_REGEX,
  STORAGE_KEY_SEPARATOR,
} from './local-storage.constants';

export function buildStorageKey(rawSections: [string, ...string[]]): string {
  const sections = rawSections.map((section) => section.trim());

  const hasEmptySection = sections.some((section) => section.length === 0);

  if (hasEmptySection) {
    throw new Error('Empty section names are not allowed when building a storage key.');
  }

  if (sections.length === 0) {
    throw new Error('At least one section must be provided to build a storage key.');
  }

  sections.forEach((section) => {
    if (!STORAGE_KEY_SECTION_REGEX.test(section)) {
      throw new Error(
        'Invalid section name provided to build a storage key. Section names must only contain lowercase letters, numbers, and dashes.',
      );
    }
  });

  return [STORAGE_KEY_BASE_PREFIX, ...sections].join(STORAGE_KEY_SEPARATOR);
}
