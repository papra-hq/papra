import { readFile } from 'node:fs/promises';
import { safely } from '@corentinth/chisels';

import { describe, expect, test } from 'vitest';
import { isFileNotFoundError } from './fs.storage-driver.models';

const makeNonexistentFilePath = () => `unexisting-file-${Math.random().toString(36).substring(2)}`;

describe('fs storage driver models', () => {
  describe('isFileNotFoundError', () => {
    test('file not found errors have a code property equal to ENOENT', () => {
      expect(isFileNotFoundError({ error: Object.assign(new Error('File not found'), { code: 'ENOENT' }) })).to.eql(true);
      expect(isFileNotFoundError({ error: { code: 'ENOENT' } })).to.eql(true);

      expect(isFileNotFoundError({ error: Object.assign(new Error('Some other error'), { code: 'SOME_OTHER_CODE' }) })).to.eql(false);
      expect(isFileNotFoundError({ error: new Error('File not found without code') })).to.eql(false);
      expect(isFileNotFoundError({ error: null })).to.eql(false);
      expect(isFileNotFoundError({ error: undefined })).to.eql(false);
      expect(isFileNotFoundError({ error: 'Some string error' })).to.eql(false);
      expect(isFileNotFoundError({ error: 123 })).to.eql(false);
    });

    test('real file not found error from fs.promises catched using safely is detected as file not found error', async () => {
      const [fileContent, error] = await safely(readFile(makeNonexistentFilePath(), 'utf-8'));

      expect(fileContent).to.eql(null);
      expect(isFileNotFoundError({ error })).to.eql(true);
    });

    test('real file not found error from fs.promises catched using try/catch is detected as file not found error', async () => {
      let error: unknown;

      try {
        await readFile(makeNonexistentFilePath(), 'utf-8');
        expect.fail('Expected readFile to throw an error');
      } catch (err) {
        error = err;
      }

      expect(isFileNotFoundError({ error })).to.eql(true);
    });
  });
});
