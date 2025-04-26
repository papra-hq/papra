import { createHash } from 'node:crypto';

export function sha256(value: string, { digest = 'hex' }: { digest?: 'hex' | 'base64' | 'base64url' } = {}) {
  return createHash('sha256').update(value).digest(digest);
}
