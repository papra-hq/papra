import { describe, expect, test } from 'vitest';
import { validateServerUrl } from './config.models';

describe('config models', () => {
  describe('validateServerUrl', () => {
    test('non-url are rejected', () => {
      expect(() => validateServerUrl({ url: 'not-a-url' })).toThrow();
      expect(() => validateServerUrl({ url: '' })).toThrow();
    });

    test('urls are trimmed', () => {
      expect(validateServerUrl({ url: '   https://example.com   ' })).to.eql('https://example.com');
    });

    test('if the url ends with a /api it is removed', () => {
      expect(validateServerUrl({ url: 'https://example.com/api' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/api/' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/papra/api/' })).to.eql('https://example.com/papra');
      expect(validateServerUrl({ url: 'https://example.com/papi' })).to.eql('https://example.com/papi');
    });

    test('protocol must be present', () => {
      expect(() => validateServerUrl({ url: 'example.com' })).toThrow();
      expect(() => validateServerUrl({ url: '192.168.0.0' })).toThrow();
    });

    test('standard urls are returned as-is', () => {
      expect(validateServerUrl({ url: 'https://example.com' })).to.eql('https://example.com');
      expect(validateServerUrl({ url: 'https://example.com/' })).to.eql('https://example.com/');
      expect(validateServerUrl({ url: 'http://example.com' })).to.eql('http://example.com');
      expect(validateServerUrl({ url: 'https://192.168.0.0' })).to.eql('https://192.168.0.0');
      expect(validateServerUrl({ url: 'https://sub.domain.example.com' })).to.eql('https://sub.domain.example.com');
      expect(validateServerUrl({ url: 'https://example.com:8080' })).to.eql('https://example.com:8080');
      expect(validateServerUrl({ url: 'https://example.com/papra' })).to.eql('https://example.com/papra');
    });
  });
});
