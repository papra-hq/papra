import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { decrypt, encrypt } from '../../../shared/crypto/encryption';
import { createError } from '../../../shared/errors/errors';
import { isNil } from '../../../shared/utils';
import { WRAPPED_ENCRYPTION_KEY_ENCODING } from './document-encryption.constants';
import { createDocumentKekNotFoundError, createDocumentKekRequiredError } from './document-encryptions.errors';

type DocumentKeyEncryptionKey = {
  version: string;
  key: Buffer;
};

export function getMostRecentDocumentKek({ documentKeyEncryptionKeys = [] }: { documentKeyEncryptionKeys?: DocumentKeyEncryptionKey[] }): DocumentKeyEncryptionKey {
  const sortedKeys = documentKeyEncryptionKeys.sort((a, b) => a.version.localeCompare(b.version));
  const mostRecentKey = sortedKeys[sortedKeys.length - 1];

  if (isNil(mostRecentKey)) {
    throw createDocumentKekRequiredError();
  }

  return mostRecentKey;
}

export function getKekByVersion({ documentKeyEncryptionKeys = [], version }: { documentKeyEncryptionKeys?: DocumentKeyEncryptionKey[]; version: string }): DocumentKeyEncryptionKey {
  const kek = documentKeyEncryptionKeys.find(kek => kek.version === version);

  if (isNil(kek)) {
    throw createDocumentKekNotFoundError();
  }

  return kek;
}

export function createNewEncryptionKey() {
  return crypto.randomBytes(32);
}

export function wrapEncryptionKey({ encryptionKey, kek }: { encryptionKey: Buffer; kek: DocumentKeyEncryptionKey }): string {
  try {
    return encrypt({ key: kek.key, value: encryptionKey }).toString(WRAPPED_ENCRYPTION_KEY_ENCODING);
  } catch (error) {
    throw createError({
      message: 'Unable to wrap encryption key',
      code: 'storage_driver.encryption.unable_to_wrap_encryption_key',
      statusCode: 500,
      isInternal: true,
      cause: error,
    });
  }
}

export function unwrapEncryptionKey({ wrappedEncryptionKey, kek }: { wrappedEncryptionKey: string; kek: DocumentKeyEncryptionKey }): Buffer {
  try {
    return decrypt({ encryptedValue: Buffer.from(wrappedEncryptionKey, WRAPPED_ENCRYPTION_KEY_ENCODING), key: kek.key });
  } catch (error) {
    throw createError({
      message: 'Unable to unwrap encryption key, the key might be invalid',
      code: 'storage_driver.encryption.unable_to_unwrap_encryption_key',
      statusCode: 500,
      isInternal: true,
      cause: error,
    });
  }
}
