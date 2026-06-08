import type { ScryptOptions } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

async function scryptAsync({
  password,
  salt,
  keyLength,
  options = {},
}: {
  password: string;
  salt: Buffer;
  keyLength: number;
  options?: ScryptOptions;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

const SCRYPT_PREFIX = 'scrypt';
const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 64;
const SCRYPT_PARAMS = {
  logN: 14, // Cost. For link password hashing, 2^14 cost is enough
  r: 8, // Block size
  p: 1, // Parallelization
};

export async function hashPassword({
  password,
}: {
  password: string;
}): Promise<{ passwordHash: string }> {
  const salt = randomBytes(SALT_LENGTH_BYTES);
  const options = {
    n: 2 ** SCRYPT_PARAMS.logN,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  };

  const derivedKey = await scryptAsync({ password, salt, options, keyLength: KEY_LENGTH_BYTES });
  const saltBase64 = salt.toString('base64').replace(/=+$/, ''); // Remove padding to comply with the PHC format (Buffer.from can handle unpadded base64)
  const hashBase64 = derivedKey.toString('base64').replace(/=+$/, '');

  return {
    passwordHash: `$${SCRYPT_PREFIX}$ln=${SCRYPT_PARAMS.logN},r=${SCRYPT_PARAMS.r},p=${SCRYPT_PARAMS.p}$${saltBase64}$${hashBase64}`,
  };
}

export async function verifyPassword({
  password,
  passwordHash,
}: {
  password: string;
  passwordHash: string;
}): Promise<{ isValid: boolean }> {
  const [prefix, paramsPart, saltBase64 = '', hashBase64 = ''] = passwordHash.split('$').slice(1);

  if (prefix !== SCRYPT_PREFIX) {
    return { isValid: false };
  }

  const paramsMatch = paramsPart?.match(/ln=(\d+),r=(\d+),p=(\d+)/);
  if (!paramsMatch) {
    return { isValid: false };
  }

  const logN = Number.parseInt(paramsMatch[1] ?? '', 10);
  const r = Number.parseInt(paramsMatch[2] ?? '', 10);
  const p = Number.parseInt(paramsMatch[3] ?? '', 10);

  if (Number.isNaN(logN) || Number.isNaN(r) || Number.isNaN(p)) {
    return { isValid: false };
  }

  const options = { n: 2 ** logN, r, p };

  const salt = Buffer.from(saltBase64, 'base64');
  const expectedHash = Buffer.from(hashBase64, 'base64');

  const derivedKey = await scryptAsync({ password, salt, options, keyLength: expectedHash.length });

  return {
    isValid: derivedKey.length === expectedHash.length && timingSafeEqual(derivedKey, expectedHash),
  };
}
