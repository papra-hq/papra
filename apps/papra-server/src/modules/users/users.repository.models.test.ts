import { describe, expect, test } from 'vitest';
import { escapeLikeWildcards } from './users.repository.models';

describe('users repository models', () => {
  describe('escapeLikeWildcards', () => {
    test('escape % and _ characters by prefixing them with a backslash', () => {
      expect(escapeLikeWildcards('100%_sure')).to.eql('100\\%\\_sure');

      expect(escapeLikeWildcards('hello')).to.eql('hello');
      expect(escapeLikeWildcards('    ')).to.eql('    ');
    });

    test('backslashes are also escaped', () => {
      expect(escapeLikeWildcards('C:\\path\\to\\file_%')).to.eql('C:\\\\path\\\\to\\\\file\\_\\%');
      expect(escapeLikeWildcards('\\%_')).to.eql('\\\\\\%\\_');
    });
  });
});
