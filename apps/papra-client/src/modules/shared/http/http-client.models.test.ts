import { describe, expect, test } from 'vitest';
import { buildAuthHeader, buildImpersonationHeader } from './http-client.models';

describe('http-client models', () => {
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

  describe('buildImpersonationHeader', () => {
    test('the impersonation user id is added as a x-user-id header', () => {
      expect(buildImpersonationHeader({ impersonatedUserId: 'foo' })).to.eql({ 'x-user-id': 'foo' });
    });

    test('if no impersonation user id is provided, no headers are built', () => {
      expect(buildImpersonationHeader()).to.eql({});
      expect(buildImpersonationHeader({})).to.eql({});
      expect(buildImpersonationHeader({ impersonatedUserId: undefined })).to.eql({});
      expect(buildImpersonationHeader({ impersonatedUserId: null })).to.eql({});
    });
  });
});
