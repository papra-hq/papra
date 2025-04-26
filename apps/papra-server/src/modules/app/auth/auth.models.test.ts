import type { ApiKey, ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Config } from '../../config/config.types';
import type { Session } from './auth.types';
import { describe, expect, test } from 'vitest';
import { getTrustedOrigins, isAuthenticationValid } from './auth.models';

describe('auth models', () => {
  describe('getTrustedOrigins', () => {
    test('by default the trusted origins are only the baseUrl', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [] as string[],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(trustedOrigins).to.deep.equal(['http://localhost:3000']);
    });

    test('if the user defined a list of trusted origins, it returns the client baseUrl and the trustedOrigins deduplicated', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3001',
            'http://localhost:3002',
          ],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(
        trustedOrigins,
      ).to.deep.equal([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ]);
    });
  });

  describe('checkAuthentication', () => {
    describe('coherence checks', () => {
      test('when the auth type is null, the authentication is invalid', () => {
        expect(isAuthenticationValid({
          authType: null,
        })).to.eql(false);
      });

      test('when the auth type is api-key, the apiKey is required', () => {
        expect(isAuthenticationValid({
          authType: 'api-key',
          apiKey: null,
          session: null,
        })).to.eql(false);
      });

      test('when the auth type is session, the session is required', () => {
        expect(isAuthenticationValid({
          authType: 'session',
          apiKey: null,
          session: null,
        })).to.eql(false);
      });

      test('when the auth type is api-key, the session is not allowed', () => {
        expect(isAuthenticationValid({
          authType: 'api-key',
          apiKey: {} as ApiKey,
          session: {} as Session,
        })).to.eql(false);
      });

      test('when the auth type is session, the apiKey is not allowed', () => {
        expect(isAuthenticationValid({
          authType: 'session',
          apiKey: {} as ApiKey,
          session: {} as Session,
        })).to.eql(false);
      });

      test('when the auth type is api-key, the requiredApiKeyPermissions are required', () => {
        expect(isAuthenticationValid({
          authType: 'api-key',
          apiKey: {} as ApiKey,
          session: null,
        })).to.eql(false);
      });

      test('when both the apiKey and the session are provided, the authentication is invalid', () => {
        expect(isAuthenticationValid({
          authType: 'api-key',
          apiKey: {} as ApiKey,
          session: {} as Session,
        })).to.eql(false);
      });
    });

    test('when the auth type is api-key, at least one permission must match', () => {
      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: [] as ApiKeyPermissions[],
        } as ApiKey,
        requiredApiKeyPermissions: ['documents:create'],
      })).to.eql(false);

      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: ['documents:create'],
        } as ApiKey,
        requiredApiKeyPermissions: ['documents:create'],
      })).to.eql(true);

      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: ['documents:create'],
        } as ApiKey,
        requiredApiKeyPermissions: ['documents:read'],
      })).to.eql(false);

      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: ['documents:create'],
        } as ApiKey,
        requiredApiKeyPermissions: ['documents:create', 'documents:read'],
      })).to.eql(true);
    });

    test('when the auth type is session, the session should exist', () => {
      expect(isAuthenticationValid({
        authType: 'session',
        session: null,
      })).to.eql(false);

      expect(isAuthenticationValid({
        authType: 'session',
        session: {} as Session,
      })).to.eql(true);
    });
  });
});
