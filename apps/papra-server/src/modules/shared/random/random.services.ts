import { getRandomValues } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';

export function generateId({ prefix }: { prefix?: string } = {}) {
  const id = createId();

  return prefix ? `${prefix}_${id}` : id;
}

const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateToken({ length = 32 }: { length?: number } = {}) {
  const tokenUIntArray = getRandomValues(new Uint8Array(length));

  let token = '';

  for (let i = 0; i < length; i++) {
    const charIndex = tokenUIntArray[i] % corpus.length;
    token += corpus[charIndex];
  }

  return { token };
}
