import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword } from './document-share-links.password';

describe('document-share-links.password', () => {
  describe('hash/verify password', () => {
    test('an hashed password can be verified', async () => {
      const password = 'my secret password';

      const { passwordHash } = await hashPassword({ password });
      const { isValid } = await verifyPassword({ password, passwordHash });

      expect(isValid).toBe(true);
    });

    test('an incorrect password fails verification', async () => {
      const { passwordHash } = await hashPassword({ password: 'my secret password' });
      const { isValid } = await verifyPassword({ password: 'not the right password', passwordHash });

      expect(isValid).toBe(false);
    });

    test('a malformed hash fails verification', async () => {
      expect(await verifyPassword({ password: 'any password', passwordHash: 'this-is-not-a-valid-hash' })).to.eql({ isValid: false });
    });

    test('a tampered hash fails verification', async () => {
      const { passwordHash } = await hashPassword({ password: 'my secret password' });

      expect(await verifyPassword({ password: 'my secret password', passwordHash: passwordHash.replace(/^./, 'X') })).to.eql({ isValid: false });
    });

    test('regression test, ensure Buffer can base64 decode unpadded string, as the PHC spec requires', () => {
      expect(Buffer.from('MQ==', 'base64')).toEqual(Buffer.from('MQ', 'base64'));
    });
  });
});
