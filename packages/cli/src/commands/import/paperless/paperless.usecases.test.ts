import JSZip from 'jszip';
import { describe, expect, test } from 'vitest';
import { extractFileFromArchive } from './paperless.usecases';

describe('paperless usecases', () => {
  describe('extractFileFromArchive', () => {
    test('the file content is returned when the path matches an archive entry', async () => {
      const archive = new JSZip();
      archive.file('2025-02-14 invoice.pdf', 'invoice content');

      const buffer = await extractFileFromArchive({ archive, filePath: '2025-02-14 invoice.pdf' });

      expect(buffer.toString()).toEqual('invoice content');
    });

    test('a file whose name has accents is found when the archive and the manifest use different unicode normalization forms', async () => {
      // Archives re-compressed on macOS store decomposed (NFD) names, while the Paperless manifest uses composed (NFC) names
      const archive = new JSZip();
      archive.file('Bezügemitteilung für 02-25.pdf'.normalize('NFD'), 'document content');

      const buffer = await extractFileFromArchive({
        archive,
        filePath: 'Bezügemitteilung für 02-25.pdf'.normalize('NFC'),
      });

      expect(buffer.toString()).toEqual('document content');
    });

    test('an error is thrown when the file is not in the archive', async () => {
      const archive = new JSZip();
      archive.file('other.pdf', 'other content');

      await expect(extractFileFromArchive({ archive, filePath: 'missing.pdf' })).rejects.toThrow(
        'File not found in archive: missing.pdf',
      );
    });
  });
});
