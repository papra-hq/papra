import { describe, expect, test } from 'vitest';
import { getExtension } from './path.models';

describe('path models', () => {
  describe('getExtension', () => {
    test('extracts the extension from a file name', () => {
      expect(getExtension('file.txt')).to.eql('txt');
      expect(getExtension('file.test.txt')).to.eql('txt');
    });

    test('file name without extension returns no extension', () => {
      expect(getExtension('file')).to.eql(undefined);
      expect(getExtension('file.')).to.eql(undefined);
      expect(getExtension('')).to.eql(undefined);
      expect(getExtension('.')).to.eql(undefined);
    });

    test('extension are lowercased', () => {
      expect(getExtension('file.TXT')).to.eql('txt');
      expect(getExtension('file.Test.TxT')).to.eql('txt');
    });
  });
});
