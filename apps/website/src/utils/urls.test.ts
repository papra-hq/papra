import { describe, expect, test } from 'vitest';
import { formatCanonicalUrl } from './urls';

describe('urls', () => {
  describe('formatCanonicalUrl', () => {
    test('canonical URLs should have a trailing slash unless there are query params', () => {
      expect(formatCanonicalUrl('https://example.com')).toBe('https://example.com/');
      expect(formatCanonicalUrl('https://example.com/')).toBe('https://example.com/');
      expect(formatCanonicalUrl('https://example.com?foo=bar')).toBe('https://example.com?foo=bar');
      expect(formatCanonicalUrl('https://example.com?foo=bar/')).toBe('https://example.com?foo=bar');
    });
  });
});
