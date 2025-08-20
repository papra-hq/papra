import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { createReadableStream } from '../shared/streams/readable-stream';
import { getFile } from './ingestion-folders.services';

describe('ingestion-folders services', () => {
  describe('getFile', () => {
    test('reads a file from the fs and returns a File instance', async () => {
      const { fileStream, mimeType, fileName } = getFile({
        filePath: 'test.txt',
        fs: { createReadStream: () => createReadableStream({ content: 'test' }) },
      });

      expect(fileStream).instanceOf(Readable);
      expect(mimeType).to.equal('text/plain');
      expect(fileName).to.equal('test.txt');
    });

    test('a file with a weird extension is considered a octet-stream', async () => {
      const { fileStream, mimeType, fileName } = getFile({
        filePath: 'test.weird',
        fs: { createReadStream: () => createReadableStream({ content: 'test' }) },
      });

      expect(fileStream).instanceOf(Readable);
      expect(mimeType).to.equal('application/octet-stream');
      expect(fileName).to.equal('test.weird');
    });
  });
});
