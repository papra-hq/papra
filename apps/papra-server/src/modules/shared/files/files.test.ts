import { describe, expect, test } from 'vitest';
import { fileToBase64DataUrl } from './files';

describe('files', () => {
  describe('fileToBase64DataUrl', () => {
    test('builds a base64 data url from a file', async () => {
      const file = new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' });

      expect(await fileToBase64DataUrl(file)).to.eql('data:text/plain;base64,bG9yZW0gaXBzdW0=');
    });
  });
});
