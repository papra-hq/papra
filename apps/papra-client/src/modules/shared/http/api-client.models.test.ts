import { describe, expect, test } from 'vitest';
import { buildAuthHeader, shouldRefreshAuthTokens } from './api-client.models';

describe('api-client models', () => {
  describe('buildAuthHeader', () => {
    test('given a auth token the autorization header is a standard bearer token', () => {
      expect(buildAuthHeader({ accessToken: 'foo' })).to.eql({ Authorization: 'Bearer foo' });
    });

    test('if no auth token is provided, no headers are built', () => {
      expect(buildAuthHeader()).to.eql({});
      expect(buildAuthHeader({})).to.eql({});
      expect(buildAuthHeader({ accessToken: undefined })).to.eql({});
      expect(buildAuthHeader({ accessToken: null })).to.eql({});
    });
  });

  describe('shouldRefreshAuthTokens', () => {
    test('the tokens should be refreshed if the api replies with a 401 status code', () => {
      expect(shouldRefreshAuthTokens({ error: { status: 401 } })).to.eql(true);

      expect(shouldRefreshAuthTokens({ error: { status: 200 } })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: { status: 500 } })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: { status: 404 } })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: { status: 403 } })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: { status: undefined } })).to.eql(false);

      expect(shouldRefreshAuthTokens({ error: undefined })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: null })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: {} })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: { foo: 'bar' } })).to.eql(false);
      expect(shouldRefreshAuthTokens({ error: 'foo' })).to.eql(false);
    });
  });
});
