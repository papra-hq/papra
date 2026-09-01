import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { getKekByVersion, getMostRecentKek } from './storage-encryption.models';
import { createKekNotFoundError, createKekRequiredError } from './storage-encryption.errors';

describe('storage-encryption models', () => {
  describe('getMostRecentKek', () => {
    test('given an array of document KEKs, the key with the highest version is returned', () => {
      const keyEncryptionKeys = [
        { version: '1', key: Buffer.from('key1') },
        { version: '3', key: Buffer.from('key3') },
        { version: '2', key: Buffer.from('key2') },
      ];

      expect(getMostRecentKek({ keyEncryptionKeys })).to.eql({
        version: '3',
        key: Buffer.from('key3'),
      });
    });

    test('when no KEK is found, an error is thrown', () => {
      expect(() => getMostRecentKek({ keyEncryptionKeys: undefined })).toThrow(
        createKekRequiredError(),
      );
      expect(() => getMostRecentKek({ keyEncryptionKeys: [] })).toThrow(createKekRequiredError());
    });
  });

  describe('getKekByVersion', () => {
    test('given a version, the KEK with the matching version is returned', () => {
      const keyEncryptionKeys = [
        { version: '1', key: Buffer.from('key1') },
        { version: '3', key: Buffer.from('key3') },
        { version: '2', key: Buffer.from('key2') },
      ];

      expect(getKekByVersion({ keyEncryptionKeys, version: '2' })).to.eql({
        version: '2',
        key: Buffer.from('key2'),
      });
    });

    test('when no KEK is found, an error is thrown', () => {
      expect(() => getKekByVersion({ keyEncryptionKeys: [], version: '2' })).toThrow(
        createKekNotFoundError(),
      );
      expect(() => getKekByVersion({ keyEncryptionKeys: undefined, version: '2' })).toThrow(
        createKekNotFoundError(),
      );
    });
  });
});
