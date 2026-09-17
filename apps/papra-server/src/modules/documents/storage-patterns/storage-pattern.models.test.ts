import type { StoragePatternInterpolationContext } from './storage-pattern.types';
import { describe, expect, test } from 'vitest';
import {
  evaluateStoragePatternExpression,
  tokenizeStringArguments,
} from './storage-pattern.models';

describe('storage-pattern models', () => {
  describe('evaluateStoragePatternExpression', () => {
    const context: StoragePatternInterpolationContext = {
      documentId: 'doc_012345678901234567890123',
      documentName: 'My Document.pdf',
      organizationId: 'org_012345678901234567890123',
      now: new Date('2025-05-15T12:34:56.789Z'),
    };

    test('a null value uses the fallback without formatting it as a date', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null, fallback: 'no-date' },
          context,
          transformerParts: ['formatDate "{yyyy}"', 'uppercase'],
        }),
      ).toEqual('no-date');
    });

    test('an undefined value uses the fallback without transformers', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => undefined, fallback: 'unknown' },
          context,
          transformerParts: [],
        }),
      ).toEqual('unknown');
    });

    test('an empty string uses the fallback', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => '', fallback: 'unknown' },
          context,
          transformerParts: ['padStart 10 0'],
        }),
      ).toEqual('unknown');
    });

    test('a present value is transformed instead of using the fallback', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: {
            resolve: ({ now }) => now.toISOString(),
            fallback: 'no-date',
          },
          context,
          transformerParts: ['formatDate {yyyy}', 'padStart 6 0'],
        }),
      ).toEqual('002025');
    });

    test('an explicitly empty fallback is preserved', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null, fallback: '' },
          context,
          transformerParts: [],
        }),
      ).toEqual('');
    });

    test('a missing value without a fallback throws an error', () => {
      expect(() =>
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null },
          context,
          transformerParts: [],
        }),
      ).toThrow('Expression resolved to an empty value');
    });

    test('unknown transformers are rejected even when the value is missing', () => {
      expect(() =>
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null, fallback: 'no-date' },
          context,
          transformerParts: ['unknownTransformer'],
        }),
      ).toThrow('Unknown transformer: unknownTransformer');
    });

    test('default replaces a null date after formatting and overrides the definition fallback', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null, fallback: 'no-date' },
          context,
          transformerParts: ['formatDate "{yyyy}"', 'default "undated"'],
        }),
      ).toEqual('undated');
    });

    test('default replaces an undefined value and subsequent transformers process it', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => undefined },
          context,
          transformerParts: ['default "unknown supplier"', 'uppercase'],
        }),
      ).toEqual('UNKNOWN SUPPLIER');
    });

    test('default replaces an empty string', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => '' },
          context,
          transformerParts: ['default unnamed'],
        }),
      ).toEqual('unnamed');
    });

    test('default preserves a present value including a zero string', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => '0', fallback: 'unknown' },
          context,
          transformerParts: ['default missing', 'padStart 3 0'],
        }),
      ).toEqual('000');
    });

    test('the first default supplies the value for later defaults', () => {
      expect(
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null },
          context,
          transformerParts: ['default first', 'default second'],
        }),
      ).toEqual('first');
    });

    test('default requires an argument even when the value is missing', () => {
      expect(() =>
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => null, fallback: 'unknown' },
          context,
          transformerParts: ['default'],
        }),
      ).toThrow('The default transformer requires a non-empty fallback argument');
    });

    test('default does not hide an invalid date', () => {
      expect(() =>
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => 'invalid-date' },
          context,
          transformerParts: ['formatDate {yyyy}', 'default no-date'],
        }),
      ).toThrow('Invalid date value: invalid-date');
    });

    test('a fallback does not hide an invalid date', () => {
      expect(() =>
        evaluateStoragePatternExpression({
          expressionDefinition: { resolve: () => 'invalid-date', fallback: 'no-date' },
          context,
          transformerParts: ['formatDate {yyyy}'],
        }),
      ).toThrow('Invalid date value: invalid-date');
    });
  });

  describe('tokenizeStringArguments', () => {
    test('given a string of space-separated arguments, split them into an array', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1 arg2 arg3' })).to.eql([
        'arg1',
        'arg2',
        'arg3',
      ]);
      expect(tokenizeStringArguments({ argumentsString: 'arg1' })).to.eql(['arg1']);
    });

    test('arguments can be wrapped in quotes to include spaces', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1 "arg 2 with spaces" arg3' })).to.eql([
        'arg1',
        'arg 2 with spaces',
        'arg3',
      ]);
      expect(tokenizeStringArguments({ argumentsString: '"arg with spaces"' })).to.eql([
        'arg with spaces',
      ]);
      expect(tokenizeStringArguments({ argumentsString: '"arg" "with spaces"' })).to.eql([
        'arg',
        'with spaces',
      ]);
      expect(tokenizeStringArguments({ argumentsString: '"arg""with spaces"' })).to.eql([
        'arg',
        'with spaces',
      ]);
    });

    test('quotes can be escaped with a backslash', () => {
      expect(
        tokenizeStringArguments({ argumentsString: 'arg1 "arg with \\"escaped quotes\\"" arg3' }),
      ).to.eql(['arg1', 'arg with "escaped quotes"', 'arg3']);
      expect(
        tokenizeStringArguments({ argumentsString: '"arg with \\"escaped quotes\\""' }),
      ).to.eql(['arg with "escaped quotes"']);
      expect(tokenizeStringArguments({ argumentsString: '\\"' })).to.eql(['"']);
      expect(tokenizeStringArguments({ argumentsString: '\\"arg' })).to.eql(['"arg']);
    });

    test('empty or undefined argument string returns an empty array', () => {
      expect(tokenizeStringArguments({ argumentsString: '' })).to.eql([]);
      expect(tokenizeStringArguments({ argumentsString: undefined })).to.eql([]);
    });

    test('multiple spaces between arguments are ignored', () => {
      expect(tokenizeStringArguments({ argumentsString: 'arg1   arg2    arg3' })).to.eql([
        'arg1',
        'arg2',
        'arg3',
      ]);
      expect(tokenizeStringArguments({ argumentsString: '   arg1   arg2    arg3   ' })).to.eql([
        'arg1',
        'arg2',
        'arg3',
      ]);
    });
  });
});
