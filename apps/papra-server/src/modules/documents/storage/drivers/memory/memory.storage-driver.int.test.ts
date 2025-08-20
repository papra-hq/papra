import type { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { createReadableStream, fileToReadableStream } from '../../../../shared/streams/readable-stream';
import { createFileNotFoundError } from '../../document-storage.errors';
import { runDriverTestSuites } from '../drivers.test-suite';
import { inMemoryStorageDriverFactory } from './memory.storage-driver';

describe('memory storage-driver', () => {
  describe('inMemoryStorageDriver', () => {
    runDriverTestSuites({
      createDriver: async () => {
        const inMemoryStorageDriver = inMemoryStorageDriverFactory();

        return {
          driver: inMemoryStorageDriver,
          [Symbol.asyncDispose]: async () => {},
        };
      },
    });

    test('saves, retrieves and delete a file', async () => {
      const inMemoryStorageDriver = inMemoryStorageDriverFactory();

      const file = new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' });

      const { storageKey } = await inMemoryStorageDriver.saveFile({
        fileStream: fileToReadableStream(file),
        fileName: 'text-file.txt',
        mimeType: 'text/plain',
        storageKey: 'org_1/text-file.txt',
      });

      expect(storageKey).to.eql('org_1/text-file.txt');

      const { fileStream } = await inMemoryStorageDriver.getFileStream({
        storageKey: 'org_1/text-file.txt',
      });

      const fileContent = await new Response(fileStream).text();

      expect(fileContent).to.eql('lorem ipsum');

      await inMemoryStorageDriver.deleteFile({ storageKey: 'org_1/text-file.txt' });

      await expect(inMemoryStorageDriver.getFileStream({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow(createFileNotFoundError());
    });

    test('mainly for testing purposes, a _getStorage() method is available to access the internal storage map', async () => {
      const inMemoryStorageDriver = inMemoryStorageDriverFactory();

      await inMemoryStorageDriver.saveFile({
        fileStream: createReadableStream({ content: 'lorem ipsum' }),
        fileName: 'text-file.txt',
        mimeType: 'text/plain',
        storageKey: 'org_1/text-file.txt',
      });

      const storage = inMemoryStorageDriver._getStorage();

      expect(storage).to.be.a('Map');
      const entries = Array.from(storage.entries());

      expect(entries).to.have.length(1);
      const [key, file] = entries[0] as [string, { content: Buffer; mimeType: string; fileName: string }];

      expect(key).to.eql('org_1/text-file.txt');
      expect(file).to.be.a('object');
      expect(file.content.toString('utf-8')).to.eql('lorem ipsum');
    });
  });
});
