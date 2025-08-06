import { randomBytes } from 'node:crypto';
import { customAlphabet } from 'nanoid';

const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(corpus);

export function generateToken({ length = 32 }: { length?: number } = {}) {
  const token = nanoid(length);

  return { token };
}

export function generateEncryptionKey({ bytes = 32 }: { bytes?: number } = {}) {
  return randomBytes(bytes).toString('base64url');
}
