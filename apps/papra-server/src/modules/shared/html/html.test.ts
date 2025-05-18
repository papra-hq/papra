import { describe, expect, test } from 'vitest';
import { sanitize } from './html';

describe('html', () => {
  describe('sanitizeHtml', () => {
    test('all html tags and attributes should be removed from the provided string', () => {
      expect(sanitize('<p>Hello <b>world</b>!</p>')).toBe('Hello world!');
      expect(sanitize('<a href="https://example.com">Link</a>')).toBe('Link');
      expect(sanitize('<img src="https://example.com/image.png" alt="Image" />')).toBe('');
      expect(sanitize('<script>alert("Hello");</script>')).toBe('');
    });
  });
});
