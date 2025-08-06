import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { decrypt, encrypt } from './encryption';

describe('encryption', () => {
  describe('encrypt', () => {
    test('the encrypted data can be decrypted', () => {
      const data = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
      const key = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      const encrypted = encrypt({ data, key, iv: Buffer.from('6f949869ce3a4e605e4d73a9c908c534', 'hex') });
      const decrypted = decrypt({ data: encrypted, key });

      expect(encrypted).toMatchInlineSnapshot(`"b5SYac46TmBeTXOpyQjFNHCWww4vYEn3o2YIo9Nt82jyyocp5ceibHGUpjoxXOBhJMSUfa8i53DAGSp0j3Rd3CiUna70ycZqR+FKuJw84f4MOY7gEoNaV/jZsbwrTUftI6Yj9538xz7VQ+nHgaj6Y5IXAe+J2IeMy3wN7EqglrhxsH3214O8PjcK1532pPFm"`);
      expect(decrypted).toBe(data);
    });
  });
});
