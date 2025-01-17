import type { Config } from '../../../../config/config.types';
import { describe, expect, test } from 'vitest';
import { inMemoryStorageDriverFactory } from './memory.storage-driver';

describe('memory storage-driver', () => {
  describe('inMemoryStorageDriver', () => {
    test('saves, retrieves and delete a file', async () => {
      const inMemoryStorageDriver = await inMemoryStorageDriverFactory({ config: {} as Config });

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

      await expect(inMemoryStorageDriver.getFileStream({ storageKey: 'org_1/text-file.txt' })).rejects.toThrow('File not found');
    });
  });
});
