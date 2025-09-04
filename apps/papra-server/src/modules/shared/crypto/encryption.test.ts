import { Buffer } from 'node:buffer';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { describe, expect, test } from 'vitest';
import { collectReadableStreamToString } from '../streams/readable-stream';
import { createDecryptTransformer, createEncryptTransformer, decrypt, encrypt } from './encryption';

describe('encryption', () => {
  describe('encrypt / decrypt', () => {
    test('an encrypted value can be decrypted with the same key', () => {
      const key = Buffer.from('u+aFUIt/XEO5mhqB8tLVCiFyiFK/k7AxZD2TAvO0x0k=', 'base64');
      const value = 'test';

      const encryptedValue = encrypt({ key, value });
      const decryptedValue = decrypt({ encryptedValue, key });

      expect(decryptedValue.toString('utf8')).to.eql(value);
    });
  });

  describe('encrypt / decrypt stream', () => {
    test('an encrypted stream can be decrypted with the same key', async () => {
      const key = Buffer.from('u+aFUIt/XEO5mhqB8tLVCiFyiFK/k7AxZD2TAvO0x0k=', 'base64');
      const inputStream = new Readable({
        read() {
          this.push(Buffer.from('foo'));
          this.push(Buffer.from('bar'));
          this.push(null);
        },
      });

      let output = '';
      const outputStream = new Writable({
        write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void) {
          output += chunk.toString('utf8');
          callback();
        },
      });

      await pipeline(
        inputStream,
        createEncryptTransformer({ key }),
        createDecryptTransformer({ key }),
        outputStream,
      );

      expect(output).to.eql('foobar');
    });
  });

  describe('decrypt stream', () => {
    describe('the chunks can be of different sizes', () => {
      const key = Buffer.from('u+aFUIt/XEO5mhqB8tLVCiFyiFK/k7AxZD2TAvO0x0k=', 'base64');
      // Encrypted "foobar" with key above
      const encryptedData = Buffer.from('UFAwMUAZw/UfMg5ysSJA53QuaBgdRg9LFNnKK5lV0/eCn6PD60o=', 'base64url');

      // Some variations of the encrypted data
      const variants: { name: string; data: Buffer[] }[] = [
        {
          name: 'whole encrypted data as a single chunk',
          data: [encryptedData],
        },
        {
          name: 'a chunk per byte',
          data: Array.from(encryptedData).map(byte => Buffer.from([byte])),
        },
        {
          name: '15 bytes (incomplete header), then the rest',
          data: [encryptedData.subarray(0, 15), encryptedData.subarray(15)],
        },
        {
          name: 'whole encrypted data, but last 10 bytes (incomplete tag), then the rest',
          data: [encryptedData.subarray(0, encryptedData.length - 10), encryptedData.subarray(encryptedData.length - 10)],
        },
      ] as const;

      for (const { name, data } of variants) {
        test(name, async () => {
          const stream = new Readable({
            read() {
              for (const chunk of data) {
                this.push(chunk);
              }
              this.push(null);
            },
          }).pipe(createDecryptTransformer({ key }));

          const decryptedData = await collectReadableStreamToString({ stream });

          expect(decryptedData).to.eql('foobar');
        });
      }
    });
  });
});
