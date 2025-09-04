import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { documentKeyEncryptionKeysSchema } from './document-encryption.schemas';

describe('document-encryption schemas', () => {
  describe('documentKeyEncryptionKeysSchema', () => {
    test('the user can provide a comma separated list of 32 bytes long hex strings env variable', () => {
      const env = '1:0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c,2:abdc13ff846337ef514a62d7d2cd2aa3b517d957ab7c825b8de0c7678f17a843';

      expect(
        documentKeyEncryptionKeysSchema.parse(env),
      ).to.eql([
        {
          version: '1',
          key: Buffer.from('0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c', 'hex'),
        },
        {
          version: '2',
          key: Buffer.from('abdc13ff846337ef514a62d7d2cd2aa3b517d957ab7c825b8de0c7678f17a843', 'hex'),
        },
      ]);
    });

    test('the user can provide a single 32 bytes long hex string env variable', () => {
      const env = '0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c';

      expect(
        documentKeyEncryptionKeysSchema.parse(env),
      ).to.eql([{ version: '1', key: Buffer.from(env, 'hex') }]);
    });

    test('no keys provided should not raise an error', () => {
      expect(
        documentKeyEncryptionKeysSchema.parse(undefined),
      ).to.eql(undefined);
    });
  });
});
