import { describe, expect, test } from 'vitest';
import { areStorageKeyEncryptionKeysUnique } from './storage-encryption.schemas.models';

describe('storage-encryption schemas models', () => {
  describe('areStorageKeyEncryptionKeysUnique', () => {
    test('same versions should return false, different versions should return true', () => {
      expect(
        areStorageKeyEncryptionKeysUnique([{ version: '1' }, { version: '2' }, { version: '3' }]),
      ).toBe(true);

      expect(
        areStorageKeyEncryptionKeysUnique([{ version: '1' }, { version: '2' }, { version: '1' }]),
      ).toBe(false);

      expect(areStorageKeyEncryptionKeysUnique([])).toBe(true);
      expect(areStorageKeyEncryptionKeysUnique([{ version: '1' }])).toBe(true);
    });
  });
});
