import { Buffer } from 'node:buffer';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SCRYPT_PREFIX = 'scrypt';
const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 64;

// Stored as `scrypt$<saltBase64>$<hashBase64>` so the salt and parameters travel with the hash.
export async function hashPassword({ password }: { password: string }): Promise<{ passwordHash: string }> {
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH_BYTES)) as Buffer;

  return {
    passwordHash: `${SCRYPT_PREFIX}$${salt.toString('base64')}$${derivedKey.toString('base64')}`,
  };
}

export async function verifyPassword({ password, passwordHash }: { password: string; passwordHash: string }): Promise<{ isValid: boolean }> {
  const [prefix, saltBase64, hashBase64] = passwordHash.split('$');

  if (prefix !== SCRYPT_PREFIX || saltBase64 === undefined || saltBase64 === '' || hashBase64 === undefined || hashBase64 === '') {
    return { isValid: false };
  }

  const salt = Buffer.from(saltBase64, 'base64');
  const expectedHash = Buffer.from(hashBase64, 'base64');
  const derivedKey = (await scryptAsync(password, salt, expectedHash.length)) as Buffer;

  return { isValid: derivedKey.length === expectedHash.length && timingSafeEqual(derivedKey, expectedHash) };
}
