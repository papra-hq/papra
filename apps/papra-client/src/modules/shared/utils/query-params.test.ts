import { describe, expect, test } from 'vitest';
import { asSingleParam } from './query-params';

describe('query-params', () => {
  describe('asSingleParam', () => {
    test('simple helper to help cast query params to a single string as they can be string or string[], taking only the first element if array', () => {
      expect(asSingleParam('test')).to.eql('test');
      expect(asSingleParam(['test1', 'test2'])).to.eql('test1');
      expect(asSingleParam(undefined)).to.eql(undefined);
      expect(asSingleParam([])).to.eql(undefined);
    });
  });
});
