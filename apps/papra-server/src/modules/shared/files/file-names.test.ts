import { describe, expect, test } from 'vitest';
import { getDownloadFileName, getExtension } from './file-names';

describe('extensions', () => {
  describe('getExtension', () => {
    test('extracts the extension from a file name', () => {
      expect(getExtension({ fileName: 'file.txt' })).to.eql({ extension: 'txt' });
      expect(getExtension({ fileName: 'file.test.txt' })).to.eql({ extension: 'txt' });
    });

    test('file name without extension returns no extension', () => {
      expect(getExtension({ fileName: 'file' })).to.eql({ extension: undefined });
      expect(getExtension({ fileName: 'file.' })).to.eql({ extension: undefined });
      expect(getExtension({ fileName: '' })).to.eql({ extension: undefined });
      expect(getExtension({ fileName: '.' })).to.eql({ extension: undefined });
    });
  });

  describe('getDownloadFileName', () => {
    test('appends the canonical extension when the renamed document has none', () => {
      expect(getDownloadFileName({ name: 'Q1 Report', mimeType: 'application/pdf' })).to.eql('Q1 Report.pdf');
      expect(getDownloadFileName({ name: 'invoice', mimeType: 'image/png' })).to.eql('invoice.png');
    });

    test('keeps the file name unchanged when it already has the correct extension', () => {
      expect(getDownloadFileName({ name: 'report.pdf', mimeType: 'application/pdf' })).to.eql('report.pdf');
      expect(getDownloadFileName({ name: 'archive.test.pdf', mimeType: 'application/pdf' })).to.eql('archive.test.pdf');
    });

    test('matches extensions case-insensitively', () => {
      expect(getDownloadFileName({ name: 'report.PDF', mimeType: 'application/pdf' })).to.eql('report.PDF');
    });

    test('appends the canonical extension when the existing one does not match the mime type', () => {
      expect(getDownloadFileName({ name: 'report.txt', mimeType: 'application/pdf' })).to.eql('report.txt.pdf');
    });

    test('preserves dots in the document name when there is no real extension', () => {
      expect(getDownloadFileName({ name: 'Document v1.0', mimeType: 'application/pdf' })).to.eql('Document v1.0.pdf');
    });

    test('returns the name unchanged for unknown or generic mime types', () => {
      expect(getDownloadFileName({ name: 'unknown', mimeType: 'application/octet-stream' })).to.eql('unknown');
      expect(getDownloadFileName({ name: 'unknown', mimeType: 'application/x-not-a-real-type' })).to.eql('unknown');
    });
  });
});
