import { describe, expect, test } from 'vitest';
import { buildStorageKey } from './local-storage.models';

describe('local-storage.models', () => {
  describe('buildStorageKey', () => {
    test('create a storage key from the provided sections, prefixed with "papra", with sections separated by "."', () => {
      expect(buildStorageKey(['stuff'])).to.eql('papra.stuff');
      expect(buildStorageKey(['config', 'api-server'])).to.eql('papra.config.api-server');
    });

    test('sections are trimmed', () => {
      expect(buildStorageKey(['  stuff  '])).to.eql('papra.stuff');
      expect(buildStorageKey(['  config  ', '  api-server  '])).to.eql('papra.config.api-server');
    });

    test('throws an error if any section is empty', () => {
      expect(() => buildStorageKey(['stuff', ''])).toThrow();
      expect(() => buildStorageKey(['stuff', '\n'])).toThrow();
      expect(() => buildStorageKey(['stuff', '\n  \r  \t'])).toThrow();
    });

    test('throws an error if no sections are provided', () => {
      expect(() => buildStorageKey([] as unknown as [string, ...string[]])).toThrow();
      expect(() => buildStorageKey([''])).toThrow();
      expect(() => buildStorageKey(['\n'])).toThrow();
      expect(() => buildStorageKey(['\n  \r  \t'])).toThrow();
    });

    test('throws an error if any section contains non-lowercase letters, numbers, or dashes as expo secure store key are strict', () => {
      expect(() => buildStorageKey(['Stuff'])).toThrow();
      expect(() => buildStorageKey(['_stuff'])).toThrow();
      expect(() => buildStorageKey(['?'])).toThrow();
      expect(() => buildStorageKey(['stuff', 'api_server'])).toThrow();
    });
  });
});
