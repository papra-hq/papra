import type { BinaryLike } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

type EncryptionAlgorithm = 'aes-256-cbc' | 'aes-256-gcm' | 'aes-256-ocb' | 'chacha20-poly1305';

export function encrypt({
  data,
  key,
  algorithm = 'aes-256-cbc',
  ivLength = 16,
  iv = randomBytes(ivLength),
}: { data: BinaryLike; key: string; algorithm?: EncryptionAlgorithm; ivLength?: number; iv?: Buffer }) {
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([iv, cipher.update(data), cipher.final()]);
  return encrypted.toString('base64');
}

export function decrypt({ data, key, algorithm = 'aes-256-cbc', ivLength = 16 }: { data: string; key: string; algorithm?: EncryptionAlgorithm; ivLength?: number }) {
  const buffer = Buffer.from(data, 'base64');
  const iv = buffer.subarray(0, ivLength);
  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(buffer.subarray(ivLength)), decipher.final()]);
  return decrypted.toString();
}
