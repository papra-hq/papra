import { Buffer } from 'node:buffer';
import { describe, expect, test } from 'vitest';
import { getFile } from './ingestion-folders.services';

describe('ingestion-folders services', () => {
  describe('getFile', () => {
    const readFile = async () => Buffer.from('test');

    test('reads a file from the fs and returns a File instance', async () => {
      const { file } = await getFile({
        filePath: 'test.txt',
        fs: { readFile },
      });

      expect(file).instanceOf(File);
      expect(file.type).to.equal('text/plain');
      expect(file.name).to.equal('test.txt');
      expect(file.size).to.equal(4);
      expect(await file.text()).to.equal('test');
    });

    test('a file with a weird extension is considered a octet-stream', async () => {
      const { file } = await getFile({
        filePath: 'test.weird',
        fs: { readFile },
      });

      expect(file).instanceOf(File);
      expect(file.type).to.equal('application/octet-stream');
      expect(file.name).to.equal('test.weird');
      expect(file.size).to.equal(4);
      expect(await file.text()).to.equal('test');
    });
  });
});
