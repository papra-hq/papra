import { Buffer } from 'node:buffer';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';

import { coercedDocumentKeyEncryptionKeysListSchema } from './document-encryption.schemas';

describe('document-encryption schemas', () => {
  describe('documentKeyEncryptionKeysSchema', () => {
    test('the user can provide a comma separated list of 32 bytes long hex strings env variable', () => {
      expect(
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          '1:0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c,2:abdc13ff846337ef514a62d7d2cd2aa3b517d957ab7c825b8de0c7678f17a843',
        ),
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

    test('versions should be unique', () => {
      expect(
        () =>
          v.parse(
            coercedDocumentKeyEncryptionKeysListSchema,
            '1:0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c,1:abdc13ff846337ef514a62d7d2cd2aa3b517d957ab7c825b8de0c7678f17a843',
          ),
      ).toThrow('The keys must have unique versions');
    });

    test('the user can provide a single 32 bytes long hex string env variable', () => {
      expect(
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          '0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c',
        ),
      ).to.eql([
        {
          version: '1',
          key: Buffer.from('0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c', 'hex'),
        },
      ]);
    });

    test('the user can provide a single versioned 32 bytes long hex string env variable', () => {
      expect(
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          '42:0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c',
        ),
      ).to.eql([
        {
          version: '42',
          key: Buffer.from('0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c', 'hex'),
        },
      ]);
    });

    test('no keys provided should not raise an error', () => {
      expect(
        v.parse(coercedDocumentKeyEncryptionKeysListSchema, undefined),
      ).to.eql(undefined);
    });

    test('keys should be 32 bytes long hex strings', () => {
      expect(() =>
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          '0deba553',
        ),
      ).to.throw();

      expect(() =>
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          // 33 bytes long hex string
          '0deba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c8',
        ),
      ).to.throw();

      expect(() =>
        v.parse(
          coercedDocumentKeyEncryptionKeysListSchema,
          // 32 bytes long but not a hex string
          'Zdeba5534bd70548de92d1fd4ae37cf901cca3dc20589b7e022ddb680c98e50c',
        ),
      ).to.throw();
    });
  });
});
