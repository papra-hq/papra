import { describe, expect, test } from 'vitest';
import { sha256 } from './hash';

describe('hash', () => {
  describe('sha256', () => {
    test('hashes a string using sha256', () => {
      expect(sha256('test')).to.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });

    test('the output format can be specified, default is hex', () => {
      expect(sha256('test', { digest: 'base64' })).to.eql('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=');
      expect(sha256('test', { digest: 'base64url' })).to.eql('n4bQgYhMfWWaL-qgxVrQFaO_TxsrC4Is0V1sFbDwCgg');
      expect(sha256('test', { digest: 'hex' })).to.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');

      expect(sha256('test', { })).to.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      expect(sha256('test', undefined)).to.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      expect(sha256('test')).to.eql('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });
  });
});
