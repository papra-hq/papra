import { describe, expect, test } from 'vitest';
import { areDocumentKeyEncryptionKeysUnique } from './document-encryption.schemas.models';

describe('document-encryption schemas models', () => {
  describe('areDocumentKeyEncryptionKeysUnique', () => {
    test('same versions should return false, different versions should return true', () => {
      expect(areDocumentKeyEncryptionKeysUnique([
        { version: '1' },
        { version: '2' },
        { version: '3' },
      ])).toBe(true);

      expect(areDocumentKeyEncryptionKeysUnique([
        { version: '1' },
        { version: '2' },
        { version: '1' },
      ])).toBe(false);

      expect(areDocumentKeyEncryptionKeysUnique([])).toBe(true);
      expect(areDocumentKeyEncryptionKeysUnique([{ version: '1' }])).toBe(true);
    });
  });
});
