import { describe, expect, test } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer, signBody, verifySignature } from './signature';

const arrayBuffer = (str: string) => new TextEncoder().encode(str).buffer as ArrayBuffer;

describe('signature', () => {
  describe('signBody', () => {
    test('a buffer can be signed with a secret, the resulting signature is a base64 encoded string', async () => {
      const bodyBuffer = arrayBuffer('test');
      const secret = 'secret-key';

      const { signature } = await signBody({ bodyBuffer, secret });

      expect(signature).to.equal('2yIt56m6njKnw7VCoPEYRQE1jSIxyuYutt8/c1ezh9M=');
    });
  });

  describe('verifySignature', () => {
    test('verify that the signature of a buffer has been created with a given secret', async () => {
      const bodyBuffer = arrayBuffer('test');
      const secret = 'secret-key';
      const signature = '2yIt56m6njKnw7VCoPEYRQE1jSIxyuYutt8/c1ezh9M=';

      const result = await verifySignature({ bodyBuffer, signature, secret });

      expect(result).to.equal(true);
    });
  });

  describe('arrayBufferToBase64', () => {
    test('a buffer can be converted to a base64 encoded string', () => {
      expect(arrayBufferToBase64(arrayBuffer('test'))).to.equal('dGVzdA==');
      expect(arrayBufferToBase64(arrayBuffer(''))).to.equal('');
    });
  });

  describe('base64ToArrayBuffer', () => {
    test('a base64 encoded string can be converted to a buffer', () => {
      expect(base64ToArrayBuffer('dGVzdA==')).to.deep.equal(arrayBuffer('test'));
      expect(base64ToArrayBuffer('')).to.deep.equal(arrayBuffer(''));
    });

    test('an error is thrown when the base64 encoded string is invalid', () => {
      expect(() => base64ToArrayBuffer('invalid--')).to.throw('Invalid character');
    });

    test('a buffer can be converted to a base64 encoded string and back to a buffer', () => {
      expect(
        base64ToArrayBuffer(
          arrayBufferToBase64(
            arrayBuffer('test'),
          ),
        ),
      ).to.deep.equal(arrayBuffer('test'));
    });
  });
});
