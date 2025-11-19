import type { ApiKey, ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Config } from '../../config/config.types';
import type { Session } from './auth.types';
import { describe, expect, test } from 'vitest';
import { getTrustedOrigins, isAuthenticationValid, isEmailDomainAllowed } from './auth.models';

describe('auth models', () => {
  describe('getTrustedOrigins', () => {
    test('by default the trusted origins are only the baseUrl', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [] as string[],
          trustedAppSchemes: [] as string[],
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
          trustedAppSchemes: [] as string[],
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

    test('if the app baseUrl is set, it should be used instead of the client baseUrl', () => {
      const config = {
        appBaseUrl: 'https://papra.app',
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
          trustedAppSchemes: [] as string[],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(trustedOrigins).to.deep.equal([
        'https://papra.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ]);
    });

    test('when trusted app schemes are defined, they should be included in the trusted origins', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [
            'http://localhost:3001',
          ],
          trustedAppSchemes: [
            'papra://',
            'exp://',
          ],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(
        trustedOrigins,
      ).to.deep.equal([
        'http://localhost:3000',
        'http://localhost:3001',
        'papra://',
        'exp://',
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

    test('when the auth type is api-key, all permissions must match', () => {
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
      })).to.eql(false);

      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: ['documents:create', 'documents:read'],
        } as ApiKey,
        requiredApiKeyPermissions: ['documents:create', 'documents:read'],
      })).to.eql(true);

      expect(isAuthenticationValid({
        authType: 'api-key',
        apiKey: {
          permissions: ['documents:create', 'documents:read', 'documents:update'],
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

  describe('isEmailDomainAllowed', () => {
    test('when no forbidden domains are configured, all email domains are allowed', () => {
      expect(isEmailDomainAllowed({
        email: 'user@example.com',
        forbiddenEmailDomains: undefined,
      })).to.eql(true);

      expect(isEmailDomainAllowed({
        email: 'user@example.com',
        forbiddenEmailDomains: new Set(),
      })).to.eql(true);
    });

    test('when an email domain is in the forbidden list, the email is rejected', () => {
      const forbiddenEmailDomains = new Set(['tempmail.com', 'disposable.email']);

      expect(isEmailDomainAllowed({
        email: 'user@tempmail.com',
        forbiddenEmailDomains,
      })).to.eql(false);

      expect(isEmailDomainAllowed({
        email: 'user@disposable.email',
        forbiddenEmailDomains,
      })).to.eql(false);
    });

    test('when an email domain is not in the forbidden list, the email is allowed', () => {
      const forbiddenEmailDomains = new Set(['tempmail.com', 'disposable.email']);

      expect(isEmailDomainAllowed({
        email: 'user@example.com',
        forbiddenEmailDomains,
      })).to.eql(true);

      expect(isEmailDomainAllowed({
        email: 'user@papra.app',
        forbiddenEmailDomains,
      })).to.eql(true);
    });

    test('email domain matching is case-insensitive', () => {
      const forbiddenEmailDomains = new Set(['tempmail.com']);

      expect(isEmailDomainAllowed({
        email: 'user@TEMPMAIL.COM',
        forbiddenEmailDomains,
      })).to.eql(false);

      expect(isEmailDomainAllowed({
        email: 'user@TempMail.Com',
        forbiddenEmailDomains,
      })).to.eql(false);
    });

    test('when an email has no @ symbol, it is rejected', () => {
      const forbiddenEmailDomains = new Set(['notanemail']);

      expect(isEmailDomainAllowed({
        email: 'notanemail',
        forbiddenEmailDomains,
      })).to.eql(false);

      expect(isEmailDomainAllowed({
        email: 'notanemail@',
        forbiddenEmailDomains,
      })).to.eql(false);
    });

    test('email domains with whitespace are properly trimmed before checking', () => {
      const forbiddenEmailDomains = new Set(['tempmail.com']);

      expect(isEmailDomainAllowed({
        email: 'user@tempmail.com  ',
        forbiddenEmailDomains,
      })).to.eql(false);

      expect(isEmailDomainAllowed({
        email: 'user@  tempmail.com  ',
        forbiddenEmailDomains,
      })).to.eql(false);
    });
  });
});
