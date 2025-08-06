import type { BinaryLike, BinaryToTextEncoding } from 'node:crypto';
import { createHash } from 'node:crypto';

export function sha256(value: string, { digest = 'hex' }: { digest?: 'hex' | 'base64' | 'base64url' } = {}) {
  return createHash('sha256').update(value).digest(digest);
}

export function md5(value: BinaryLike, { digest = 'hex' }: { digest?: BinaryToTextEncoding } = {}) {
  return createHash('md5').update(value).digest(digest);
}
