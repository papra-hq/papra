import { describe, expect, test } from 'vitest';
import { createPrefixedIdRegex } from './ids';

describe('database models', () => {
  describe('createPrefixedIdRegex', () => {
    test('build a regex for prefixed id validation', () => {
      const regex = createPrefixedIdRegex({ prefix: 'tag' });

      expect(regex.toString()).to.eql('/^tag_[a-z0-9]{24}$/');
    });
  });
});
