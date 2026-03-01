import { describe, expect, test } from 'vitest';
import { tokenizeStringArguments } from './storage-pattern.models';

describe('storage-pattern models', () => {
  describe('tokenizeStringArguments', () => {
    test('given a string of space-separated arguments, split them into an array', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1 arg2 arg3' })).to.eql(['arg1', 'arg2', 'arg3']);
      expect(tokenizeStringArguments({ argumentsString: 'arg1' })).to.eql(['arg1']);
    });

    test('arguments can be wrapped in quotes to include spaces', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1 "arg 2 with spaces" arg3' })).to.eql(['arg1', 'arg 2 with spaces', 'arg3']);
      expect(tokenizeStringArguments({ argumentsString: '"arg with spaces"' })).to.eql(['arg with spaces']);
      expect(tokenizeStringArguments({ argumentsString: '"arg" "with spaces"' })).to.eql(['arg', 'with spaces']);
      expect(tokenizeStringArguments({ argumentsString: '"arg""with spaces"' })).to.eql(['arg', 'with spaces']);
    });

    test('quotes can be escaped with a backslash', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1 "arg with \\"escaped quotes\\"" arg3' })).to.eql(['arg1', 'arg with "escaped quotes"', 'arg3']);
      expect(tokenizeStringArguments({ argumentsString: '"arg with \\"escaped quotes\\""' })).to.eql(['arg with "escaped quotes"']);
      expect(tokenizeStringArguments({ argumentsString: '\\"' })).to.eql(['"']);
      expect(tokenizeStringArguments({ argumentsString: '\\"arg' })).to.eql(['"arg']);
    });

    test('empty or undefined argument string returns an empty array', () => {
      expect(tokenizeStringArguments({ argumentsString: '' })).to.eql([]);
      expect(tokenizeStringArguments({ argumentsString: undefined })).to.eql([]);
    });

    test('multiple spaces between arguments are ignored', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1   arg2    arg3' })).to.eql(['arg1', 'arg2', 'arg3']);
      expect(tokenizeStringArguments({ argumentsString: '   arg1   arg2    arg3   ' })).to.eql(['arg1', 'arg2', 'arg3']);
    });
  });
});
