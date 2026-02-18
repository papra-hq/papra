import { castError } from '@corentinth/chisels';
import { describe, expect, test } from 'vitest';
import { isFileAlreadyExistsError } from './fs.models';

describe('fs models', () => {
  describe('isFileAlreadyExistsError', () => {
    test('errors about file already existing have either code "EEXIST" or "ERROR_FILE_EXISTS" or an errno of -17', () => {
      expect(isFileAlreadyExistsError({ error: castError({ code: 'EEXIST' }) })).toBe(true);
      expect(isFileAlreadyExistsError({ error: castError({ code: 'ERROR_FILE_EXISTS' }) })).toBe(true);
      expect(isFileAlreadyExistsError({ error: castError({ errno: -17 }) })).toBe(true);

      expect(isFileAlreadyExistsError({ error: castError({ code: 'ENOENT' }) })).toBe(false);
      expect(isFileAlreadyExistsError({ error: castError({ errno: -2 }) })).toBe(false);
      expect(isFileAlreadyExistsError({ error: castError({}) })).toBe(false);
    });
  });
});
