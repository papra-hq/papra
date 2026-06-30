import { describe, expect, test } from 'vitest';
import { fileToBase64DataUrl, fileToBase64 } from './files';

describe('files', () => {
  describe('fileToBase64', () => {
    test('builds a base64 string from a file', async () => {
      const file = new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' });

      expect(await fileToBase64(file)).to.eql('bG9yZW0gaXBzdW0=');
    });
  });

  describe('fileToBase64DataUrl', () => {
    test('builds a base64 data url from a file', async () => {
      const file = new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' });

      expect(await fileToBase64DataUrl(file)).to.eql('data:text/plain;base64,bG9yZW0gaXBzdW0=');
    });
  });
});
