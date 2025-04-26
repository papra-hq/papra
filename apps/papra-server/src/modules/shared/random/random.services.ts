import { customAlphabet } from 'nanoid';

const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(corpus);

export function generateToken({ length = 32 }: { length?: number } = {}) {
  const token = nanoid(length);

  return { token };
}
