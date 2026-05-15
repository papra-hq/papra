import { describe, expect, test } from 'vitest';
import { getMimeTypeForExtension } from './file.models';

describe('file.services', () => {
  describe('getMimeTypeForExtension', () => {
    test('given a known extension, returns its mime type', () => {
      expect(getMimeTypeForExtension({ extension: 'png' })).toBe('image/png');
      expect(getMimeTypeForExtension({ extension: 'jpg' })).toBe('image/jpeg');
      expect(getMimeTypeForExtension({ extension: 'jpeg' })).toBe('image/jpeg');
      expect(getMimeTypeForExtension({ extension: 'pdf' })).toBe('application/pdf');
    });

    test('given an unknown extension, returns the fallback mime type', () => {
      expect(getMimeTypeForExtension({ extension: 'foo' })).toBe('application/octet-stream');
      expect(getMimeTypeForExtension({ extension: undefined })).toBe('application/octet-stream');
    });

    test('the fallback mime type can be customized', () => {
      expect(getMimeTypeForExtension({ extension: 'foo', fallbackMimeType: 'text/plain' })).toBe('text/plain');
      expect(getMimeTypeForExtension({ extension: undefined, fallbackMimeType: 'text/plain' })).toBe('text/plain');
    });
  });
});
