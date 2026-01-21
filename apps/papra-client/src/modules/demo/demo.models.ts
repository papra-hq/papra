const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function randomString({ length = 10 }: { length?: number } = {}) {
  return Array.from({ length }, () => corpus[Math.floor(Math.random() * corpus.length)]).join('');
}

export function createId({ prefix }: { prefix: string }) {
  return `${prefix}_${randomString({ length: 24 })}`;
}
