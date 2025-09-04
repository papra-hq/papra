import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { getKekByVersion, getMostRecentDocumentKek } from './document-encryption.models';
import { createDocumentKekNotFoundError, createDocumentKekRequiredError } from './document-encryptions.errors';

describe('document-encryption models', () => {
  describe('getMostRecentDocumentKek', () => {
    test('given an array of document KEKs, the key with the highest version is returned', () => {
      const documentKeyEncryptionKeys = [
        { version: '1', key: Buffer.from('key1') },
        { version: '3', key: Buffer.from('key3') },
        { version: '2', key: Buffer.from('key2') },
      ];

      expect(
        getMostRecentDocumentKek({ documentKeyEncryptionKeys }),
      ).to.eql(
        { version: '3', key: Buffer.from('key3') },
      );
    });

    test('when no KEK is found, an error is thrown', () => {
      expect(() => getMostRecentDocumentKek({ documentKeyEncryptionKeys: undefined })).toThrow(createDocumentKekRequiredError());
      expect(() => getMostRecentDocumentKek({ documentKeyEncryptionKeys: [] })).toThrow(createDocumentKekRequiredError());
    });
  });

  describe('getKekByVersion', () => {
    test('given a version, the KEK with the matching version is returned', () => {
      const documentKeyEncryptionKeys = [
        { version: '1', key: Buffer.from('key1') },
        { version: '3', key: Buffer.from('key3') },
        { version: '2', key: Buffer.from('key2') },
      ];

      expect(getKekByVersion({ documentKeyEncryptionKeys, version: '2' })).to.eql({ version: '2', key: Buffer.from('key2') });
    });

    test('when no KEK is found, an error is thrown', () => {
      expect(() => getKekByVersion({ documentKeyEncryptionKeys: [], version: '2' })).toThrow(createDocumentKekNotFoundError());
      expect(() => getKekByVersion({ documentKeyEncryptionKeys: undefined, version: '2' })).toThrow(createDocumentKekNotFoundError());
    });
  });
});
