const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateShareLinkPassword({ length = 12 }: { length?: number } = {}) {
  const values = crypto.getRandomValues(new Uint32Array(length));

  // Modulo bias but negligible for our use case
  return Array.from(values, value => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('');
}
