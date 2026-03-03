import { describe, expect, test } from 'vitest';
import { ensureBooleanArg } from './args.utils';

describe('args utils', () => {
  describe('ensureBooleanArg', () => {
    test('when parsing cli args, the native node parseArgs does not guarantee the type of boolean args, so we need to ensure they are boolean', () => {
      expect(ensureBooleanArg(true)).toBe(true);
      expect(ensureBooleanArg(false)).toBe(false);
      expect(ensureBooleanArg('true')).toBe(true);
      expect(ensureBooleanArg('false')).toBe(false);
      expect(ensureBooleanArg('1')).toBe(true);
      expect(ensureBooleanArg('0')).toBe(false);
      expect(ensureBooleanArg('yes')).toBe(true);
      expect(ensureBooleanArg('no')).toBe(false);
      expect(ensureBooleanArg('y')).toBe(true);
      expect(ensureBooleanArg('n')).toBe(false);
      expect(ensureBooleanArg('on')).toBe(true);
      expect(ensureBooleanArg('off')).toBe(false);

      expect(() => ensureBooleanArg('invalid')).toThrowError();
      expect(() => ensureBooleanArg(123)).toThrowError();
      expect(() => ensureBooleanArg(null)).toThrowError();
      expect(() => ensureBooleanArg(undefined)).toThrowError();
    });

    test('should be case-insensitive and trim the input', () => {
      expect(ensureBooleanArg('  TRUE  ')).toBe(true);
      expect(ensureBooleanArg('  false  ')).toBe(false);
      expect(ensureBooleanArg('  Yes  ')).toBe(true);
      expect(ensureBooleanArg('  No  ')).toBe(false);
    });
  });
});
