import { describe, expect, test } from 'vitest';
import { isApiRoute } from './static-assets.models';

describe('static-assets models', () => {
  describe('isApiRoute', () => {
    test('an api route starts with /api/*', () => {
      expect(isApiRoute({ path: '/api/test' })).to.equal(true);
      expect(isApiRoute({ path: '/api/' })).to.equal(true);
      expect(isApiRoute({ path: '/api' })).to.equal(true);

      expect(isApiRoute({ path: '/apitest' })).to.equal(false);
      expect(isApiRoute({ path: '/' })).to.equal(false);
      expect(isApiRoute({ path: '' })).to.equal(false);
      expect(isApiRoute({ path: '/index.html' })).to.equal(false);
    });
  });
});
