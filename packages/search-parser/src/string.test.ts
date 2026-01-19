import { describe, expect, test } from 'vitest';
import { isWhitespace } from './string';

describe('string', () => {
  describe('isWhitespace', () => {
    test('detects if the character (the first character if multiple) is a whitespace', () => {
      expect(isWhitespace(' ')).toBe(true);
      expect(isWhitespace(' ')).toBe(true);
      expect(isWhitespace('\t')).toBe(true);
      expect(isWhitespace('\n')).toBe(true);
      expect(isWhitespace(' ')).toBe(true);

      expect(isWhitespace('   ')).toBe(true);
      expect(isWhitespace(' a')).toBe(true);
      expect(isWhitespace('aqq')).toBe(false);

      expect(isWhitespace('a')).toBe(false);
      expect(isWhitespace('')).toBe(false);
    });
  });
});
