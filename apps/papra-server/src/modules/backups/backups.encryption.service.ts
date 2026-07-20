import type { Config } from '../config/config.types';
import { randomBytes } from 'node:crypto';
import { decrypt, encrypt } from '../shared/crypto/encryption';
import { createBackupsNotConfiguredError } from './backups.errors';

// Every backup destination gets its own random 256-bit key (the "DEK"). The DEK
// is wrapped with the server-wide KEK (BACKUPS_KEK) and stored on the destination
// row. The same wrap/unwrap mechanism is reused to encrypt the destination's
// credentials (refresh token, username/password) at rest — they're just treated
// as another "key" being wrapped, whatever their actual byte length.
//
// Why a key per destination instead of one key for everything: a leaked
// destination row only compromises that destination's backups, not every backup
// this org has ever taken elsewhere.

const KEY_LENGTH = 32;
const ALGORITHM = 'aes-256-gcm';

function getKek({ config }: { config: Config }): Buffer {
  const hex = config.backups.kek;
  if (!hex) {
    throw createBackupsNotConfiguredError();
  }
  return Buffer.from(hex, 'hex');
}

export interface BackupEncryptionService {
  algorithm: string;
  generateBackupKey(): Buffer;
  wrapWithKek(args: { value: Buffer }): string;
  unwrapWithKek(args: { wrapped: string }): Buffer;
  encryptPayload(args: { payload: Buffer; key: Buffer }): Buffer;
  decryptPayload(args: { encryptedPayload: Buffer; key: Buffer }): Buffer;
}

export function createBackupEncryptionService({ config }: { config: Config }): BackupEncryptionService {
  const kek = getKek({ config });

  return {
    algorithm: ALGORITHM,

    generateBackupKey(): Buffer {
      return randomBytes(KEY_LENGTH);
    },

    wrapWithKek({ value }: { value: Buffer }): string {
      return encrypt({ key: kek, value }).toString('base64');
    },

    unwrapWithKek({ wrapped }: { wrapped: string }): Buffer {
      const encrypted = Buffer.from(wrapped, 'base64');
      return decrypt({ encryptedValue: encrypted, key: kek });
    },

    encryptPayload({ payload, key }: { payload: Buffer; key: Buffer }): Buffer {
      return encrypt({ key, value: payload });
    },

    decryptPayload({ encryptedPayload, key }: { encryptedPayload: Buffer; key: Buffer }): Buffer {
      return decrypt({ encryptedValue: encryptedPayload, key });
    },
  };
}

// ----- Credential JSON helpers -----
// Credentials are a small JSON object (e.g. { refreshToken } or { username,
// password }). We JSON-stringify then wrap with the KEK for storage, and reverse
// that on read.

export function wrapCredentials({
  encryption,
  credentials,
}: {
  encryption: BackupEncryptionService;
  credentials: Record<string, string>;
}): string {
  return encryption.wrapWithKek({ value: Buffer.from(JSON.stringify(credentials), 'utf8') });
}

export function unwrapCredentials({
  encryption,
  wrapped,
}: {
  encryption: BackupEncryptionService;
  wrapped: string;
}): Record<string, string> {
  const buffer = encryption.unwrapWithKek({ wrapped });
  return JSON.parse(buffer.toString('utf8')) as Record<string, string>;
}

// ----- Single-file envelope -----
// One uploaded file per backup, not two. The wrapped key travels inside the same
// file as the encrypted payload, instead of a separate sidecar next to it — one
// less upload per backup, one less thing that can end up mismatched or deleted
// independently of the file it belongs to.
//
// Layout: [4-byte big-endian length of the wrapped-key string][wrapped-key
// bytes (utf8)][encrypted archive payload, everything after that].
export function packBackupEnvelope({ wrappedKey, encryptedPayload }: { wrappedKey: string; encryptedPayload: Buffer }): Buffer {
  const wrappedKeyBuffer = Buffer.from(wrappedKey, 'utf8');
  const lengthPrefix = Buffer.alloc(4);
  lengthPrefix.writeUInt32BE(wrappedKeyBuffer.length, 0);
  return Buffer.concat([lengthPrefix, wrappedKeyBuffer, encryptedPayload]);
}

export function unpackBackupEnvelope({ envelope }: { envelope: Buffer }): { wrappedKey: string; encryptedPayload: Buffer } {
  const keyLength = envelope.readUInt32BE(0);
  const wrappedKey = envelope.subarray(4, 4 + keyLength).toString('utf8');
  const encryptedPayload = envelope.subarray(4 + keyLength);
  return { wrappedKey, encryptedPayload };
}
