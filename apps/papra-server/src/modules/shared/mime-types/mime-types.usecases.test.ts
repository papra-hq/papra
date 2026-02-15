import { describe, expect, test } from 'vitest';
import { coerceFileMimeType } from './mime-types.usecases';

// A PDF file starts with the %PDF magic bytes
const minimalPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);

describe('mime-types usecases', () => {
  describe('coerceFileMimeType', () => {
    test('when the file already has a specific (non-octet-stream) mime type, it is preserved as-is', async () => {
      const file = new File(['hello'], 'document.txt', { type: 'text/plain' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('text/plain');
    });

    test('when the file has application/octet-stream, the mime type is detected from content magic bytes', async () => {
      const file = new File([minimalPdfBytes], 'document.pdf', { type: 'application/octet-stream' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when the file has an empty mime type, the mime type is detected from content magic bytes', async () => {
      const file = new File([minimalPdfBytes], 'document.pdf', { type: '' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when magic bytes detection fails, the mime type is inferred from the file extension', async () => {
      const file = new File(['not-a-real-pdf'], 'report.pdf', { type: 'application/octet-stream' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when neither magic bytes nor extension match, application/octet-stream is returned', async () => {
      const file = new File(['unknown content'], 'file.unknownext', { type: 'application/octet-stream' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('application/octet-stream');
    });

    test('when the file has an empty mime type and no detection matches, application/octet-stream is returned', async () => {
      const file = new File(['unknown content'], 'file.unknownext', { type: '' });

      const { mimeType } = await coerceFileMimeType({ file });

      expect(mimeType).to.eql('application/octet-stream');
    });
  });
});
