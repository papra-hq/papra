import type { BinaryLike } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { hkdfSync } from 'node:crypto';

export function deriveKeyWithHkdf({
  key,
  info,
  salt = Buffer.alloc(0),
  outputKeyLength = 32,
}: {
  key: BinaryLike;
  info: BinaryLike;
  salt?: Buffer;
  outputKeyLength?: number;
}) {
  const newKey = hkdfSync('sha256', key, salt, info, outputKeyLength);
  return Buffer.from(newKey).toString('base64url');
}
