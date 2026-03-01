import { customAlphabet } from 'nanoid';

const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(corpus);

export function generateRandomString({ length = 32 }: { length?: number } = {}) {
  return nanoid(length);
}
