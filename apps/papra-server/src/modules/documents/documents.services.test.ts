import { describe, expect, test } from 'vitest';
import { getFileSha256Hash } from './documents.services';

describe('documents services', () => {
  describe('getFileSha256Hash', () => {
    test('computes the sha256 hash in hex format of a file content', async () => {
      const file = new File(['lorem ipsum'], 'document.pdf', { type: 'application/pdf' });

      const { hash } = await getFileSha256Hash({ file });

      expect(hash).to.equal('5e2bf57d3f40c4b6df69daf1936cb766f832374b4fc0259a7cbff06e2f70f269');
    });
  });
});
