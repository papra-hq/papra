import { describe, expect, test } from 'vitest';
import { createAccessTokenRedirectionUrl } from './auth.models';

describe('auth models', () => {
  describe('createAccessTokenRedirectionUrl', () => {
    test('set the access token as a hash fragment in the redirection url', () => {
      const redirectionBaseUrl = 'https://example.com/confirm';
      const accessToken = 'foo';

      expect(createAccessTokenRedirectionUrl({ redirectionBaseUrl, accessToken })).to.eql('https://example.com/confirm#accessToken=foo');
    });
  });
});
