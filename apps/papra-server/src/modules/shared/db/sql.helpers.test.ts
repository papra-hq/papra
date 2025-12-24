import { describe, expect, test } from 'vitest';
import { escapeLikeWildcards } from './sql.helpers';

describe('sql helpers', () => {
  describe('escapeLikeWildcards', () => {
    test('when input contains percent sign, it is escaped', () => {
      const result = escapeLikeWildcards('hello%world');

      expect(result).to.equal('hello\\%world');
    });

    test('when input contains underscore, it is escaped', () => {
      const result = escapeLikeWildcards('hello_world');

      expect(result).to.equal('hello\\_world');
    });

    test('when input contains both percent and underscore, both are escaped', () => {
      const result = escapeLikeWildcards('test%value_name');

      expect(result).to.equal('test\\%value\\_name');
    });

    test('when input contains multiple wildcards, all are escaped', () => {
      const result = escapeLikeWildcards('%%__%%');

      expect(result).to.equal('\\%\\%\\_\\_\\%\\%');
    });

    test('when input contains backslashes, they are escaped', () => {
      const result = escapeLikeWildcards('hello\\world');

      expect(result).to.equal('hello\\\\world');
    });

    test('when input contains backslashes and wildcards, all are escaped', () => {
      const result = escapeLikeWildcards('test\\%value');

      expect(result).to.equal('test\\\\\\%value');
    });

    test('when input contains no wildcards, it is returned unchanged', () => {
      const result = escapeLikeWildcards('hello world');

      expect(result).to.equal('hello world');
    });

    test('when input is empty string, empty string is returned', () => {
      const result = escapeLikeWildcards('');

      expect(result).to.equal('');
    });
  });
});
