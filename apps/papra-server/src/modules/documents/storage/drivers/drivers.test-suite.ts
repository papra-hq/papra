import type { StorageDriver } from './drivers.models';
import { describe, expect, test } from 'vitest';
import { collectReadableStreamToString, createReadableStream } from '../../../shared/streams/readable-stream';
import { createFileNotFoundError } from '../document-storage.errors';

export function runDriverTestSuites({ createDriver, timeout, retry }: { createDriver: () => Promise<{ driver: StorageDriver; [Symbol.asyncDispose]: () => Promise<void> }>; timeout?: number; retry?: number }) {
  describe('upload, download, delete', () => {
    test('the driver should support uploading, retrieving and deleting files', { timeout, retry }, async () => {
      await using resource = await createDriver();

      const { driver } = resource;

      // 1. Save the file
      await driver.saveFile({
        fileName: 'test.txt',
        mimeType: 'text/plain',
        storageKey: 'files/test.txt',
        fileStream: createReadableStream({ content: 'Hello, world!' }),
      });

      // 2. Retrieve the file
      const { fileStream } = await driver.getFileStream({ storageKey: 'files/test.txt' });
      expect(await collectReadableStreamToString({ stream: fileStream })).to.eql('Hello, world!');

      // 3. Delete the file
      await driver.deleteFile({ storageKey: 'files/test.txt' });
      await expect(driver.getFileStream({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());

      // 4. Try to delete the file again
      await expect(driver.deleteFile({ storageKey: 'files/test.txt' })).rejects.toThrow(createFileNotFoundError());
    });
  });
}
