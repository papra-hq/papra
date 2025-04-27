import { describe, expect, test } from 'vitest';
import { createFileNotFoundError } from '../../document-storage.errors';
import { inMemoryStorageDriverFactory } from './memory.storage-driver';

describe('memory storage-driver', () => {
  describe('inMemoryStorageDriver', () => {
    test('saves, retrieves and delete a file', async () => {
      const inMemoryStorageDriver = await inMemoryStorageDriverFactory();

      const file = new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' });

      const { storageKey } = await inMemoryStorageDriver.saveFile({
        file,
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
      const inMemoryStorageDriver = await inMemoryStorageDriverFactory();

      await inMemoryStorageDriver.saveFile({
        file: new File(['lorem ipsum'], 'text-file.txt', { type: 'text/plain' }),
        storageKey: 'org_1/text-file.txt',
      });

      const storage = inMemoryStorageDriver._getStorage();

      expect(storage).to.be.a('Map');
      const entries = Array.from(storage.entries());

      expect(entries).to.have.length(1);
      const [key, file] = entries[0];

      expect(key).to.eql('org_1/text-file.txt');
      expect(file).to.be.a('File');
      expect(await file.text()).to.eql('lorem ipsum');
    });
  });
});
