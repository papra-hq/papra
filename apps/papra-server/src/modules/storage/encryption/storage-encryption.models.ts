import type { StorageKeyEncryptionKey } from '../storage.types';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';
import { decrypt, encrypt } from '../../shared/crypto/encryption';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { WRAPPED_ENCRYPTION_KEY_ENCODING } from './storage-encryption.constants';
import { createKekNotFoundError, createKekRequiredError } from './storage-encryption.errors';

export function getMostRecentKek({
  keyEncryptionKeys = [],
}: {
  keyEncryptionKeys?: StorageKeyEncryptionKey[];
}): StorageKeyEncryptionKey {
  const sortedKeys = keyEncryptionKeys.sort((a, b) => a.version.localeCompare(b.version));
  const mostRecentKey = sortedKeys[sortedKeys.length - 1];

  if (isNil(mostRecentKey)) {
    throw createKekRequiredError();
  }

  return mostRecentKey;
}

export function getKekByVersion({
  keyEncryptionKeys = [],
  version,
}: {
  keyEncryptionKeys?: StorageKeyEncryptionKey[];
  version: string;
}): StorageKeyEncryptionKey {
  const kek = keyEncryptionKeys.find((kek) => kek.version === version);

  if (isNil(kek)) {
    throw createKekNotFoundError();
  }

  return kek;
}

export function createNewEncryptionKey() {
  return crypto.randomBytes(32);
}

export function wrapEncryptionKey({
  encryptionKey,
  kek,
}: {
  encryptionKey: Buffer;
  kek: StorageKeyEncryptionKey;
}): string {
  try {
    return encrypt({ key: kek.key, value: encryptionKey }).toString(
      WRAPPED_ENCRYPTION_KEY_ENCODING,
    );
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

export function unwrapEncryptionKey({
  wrappedEncryptionKey,
  kek,
}: {
  wrappedEncryptionKey: string;
  kek: StorageKeyEncryptionKey;
}): Buffer {
  try {
    return decrypt({
      encryptedValue: Buffer.from(wrappedEncryptionKey, WRAPPED_ENCRYPTION_KEY_ENCODING),
      key: kek.key,
    });
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
