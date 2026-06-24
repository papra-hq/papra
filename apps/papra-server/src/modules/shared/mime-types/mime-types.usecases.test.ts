import { describe, expect, test } from 'vitest';
import { coerceMimeTypeStream } from './mime-types.usecases';
import { Readable } from 'node:stream';

// A PDF file starts with the %PDF magic bytes
const minimalPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

describe('mime-types usecases', () => {
  describe('coerceMimeTypeStream', () => {
    test('returns the original file contents unchanged', async () => {
      const file = new File([minimalPdfBytes], 'document.pdf', { type: 'application/pdf' });

      const { stream } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(
        Buffer.concat(
          await (async () => {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              chunks.push(Buffer.from(chunk));
            }
            return chunks;
          })(),
        ),
      ).to.eql(Buffer.from(minimalPdfBytes));
    });

    test('preserves content when input stream emits multiple chunks', async () => {
      const input = [Buffer.from('hello '), Buffer.from('world')];

      const { stream } = await coerceMimeTypeStream({
        fileStream: Readable.from(input),
        fileName: 'file.txt',
        declaredMimeType: 'text/plain',
      });

      const content = Buffer.concat(
        await (async () => {
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          return chunks;
        })(),
      );

      expect(content.toString()).to.eql('hello world');
    });

    test('preserves large stream contents', async () => {
      const chunk = Buffer.alloc(1024 * 1024, 'a');

      const { stream } = await coerceMimeTypeStream({
        fileStream: Readable.from([chunk, chunk]),
        fileName: 'large.txt',
      });

      let size = 0;

      for await (const part of stream) {
        size += Buffer.from(part).length;
      }

      expect(size).to.eql(chunk.length * 2);
    });

    test('returns the full stream even when mime detection fails', async () => {
      const content = Buffer.from('plain text content');

      const { stream } = await coerceMimeTypeStream({
        fileStream: Readable.from([content]),
        fileName: 'file.bin',
      });

      const output = Buffer.concat(
        await (async () => {
          const chunks: Buffer[] = [];

          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }

          return chunks;
        })(),
      );

      expect(output).to.eql(content);
    });

    test('propagates input stream errors', async () => {
      const brokenStream = Readable.from(
        (async function* () {
          yield Buffer.from('hello');
          throw new Error('error');
        })(),
      );

      const { stream } = await coerceMimeTypeStream({
        fileStream: brokenStream,
        fileName: 'file.txt',
      });

      await expect(async () => {
        for await (const _ of stream) {
        }
      }).rejects.toThrow('error');
    });

    test('does not modify binary content', async () => {
      const binary = Buffer.from([0, 255, 1, 128, 50]);

      const { stream } = await coerceMimeTypeStream({
        fileStream: Readable.from([binary]),
        fileName: 'file.bin',
      });

      const output = Buffer.concat(
        await (async () => {
          const chunks: Buffer[] = [];

          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }

          return chunks;
        })(),
      );

      expect(output).to.eql(binary);
    });

    test('detects mime type from magic bytes when available', async () => {
      const file = new File([minimalPdfBytes], 'document', {
        type: 'application/octet-stream',
      });

      const { mimeType } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when provided mime type and/or extension mismatch magic bytes, type is inferred by magic bytes', async () => {
      const file = new File([minimalPdfBytes], 'document.png', {
        type: 'image/png',
      });

      const { mimeType } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when magic bytes are not available and the file already has a specific (non-octet-stream) mime type, it is preserved as-is', async () => {
      const file = new File(['hello'], 'document.pdf', { type: 'text/plain' });

      const { mimeType } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(mimeType).to.eql('text/plain');
    });

    test('when magic bytes detection fails, and no mime is provided, the mime type is inferred from the file extension', async () => {
      const file = new File(['not-a-real-pdf'], 'report.pdf', { type: 'application/octet-stream' });

      const { mimeType } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(mimeType).to.eql('application/pdf');
    });

    test('when no mime type information is available, application/octet-stream is returned', async () => {
      const file = new File(['unknown content'], 'file.unknownext', { type: '' });

      const { mimeType } = await coerceMimeTypeStream({
        fileStream: Readable.from(file.stream()),
        fileName: file.name,
        declaredMimeType: file.type,
      });

      expect(mimeType).to.eql('application/octet-stream');
    });
  });
});
