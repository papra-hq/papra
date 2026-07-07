import { describe, expect, test } from 'vitest';
import { getExtension, joinFileName, splitFileName } from './path.models';

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

    test('extensions are lowercased', () => {
      expect(getExtension('file.TXT')).to.eql('txt');
      expect(getExtension('file.Test.TxT')).to.eql('txt');
    });
  });

  describe('splitFileName', () => {
    test('splits a file name into base name and extension', () => {
      expect(splitFileName('invoice.pdf')).to.eql({ baseName: 'invoice', extension: 'pdf' });
      expect(splitFileName('report.final.pdf')).to.eql({
        baseName: 'report.final',
        extension: 'pdf',
      });
    });

    test('file name without extension has no extension part', () => {
      expect(splitFileName('invoice')).to.eql({ baseName: 'invoice', extension: undefined });
      expect(splitFileName('invoice.')).to.eql({ baseName: 'invoice.', extension: undefined });
    });

    test('the extension is lowercased, the base name casing is preserved', () => {
      expect(splitFileName('Invoice.PDF')).to.eql({ baseName: 'Invoice', extension: 'pdf' });
    });
  });

  describe('joinFileName', () => {
    test('joins a base name and an extension', () => {
      expect(joinFileName({ baseName: 'invoice', extension: 'pdf' })).to.eql('invoice.pdf');
    });

    test('without extension the base name is returned as-is', () => {
      expect(joinFileName({ baseName: 'invoice', extension: undefined })).to.eql('invoice');
    });
  });
});
