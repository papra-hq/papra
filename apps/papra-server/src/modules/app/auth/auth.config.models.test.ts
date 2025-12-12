import { describe, expect, test } from 'vitest';
import { ensureAuthSecretIsNotDefaultInProduction } from './auth.config.models';
import { createAuthSecretIsDefaultError } from './auth.errors';

describe('auth config models', () => {
  describe('ensureAuthSecretIsNotDefaultInProduction', () => {
    const defaultAuthSecret = 'papra-default-auth-secret-change-me';

    test('throws an error if in production and auth secret is the default one', () => {
      expect(() =>
        ensureAuthSecretIsNotDefaultInProduction({
          config: { auth: { secret: defaultAuthSecret }, env: 'production' },
          defaultAuthSecret,
        }),
      ).toThrow(createAuthSecretIsDefaultError());

      expect(() =>
        ensureAuthSecretIsNotDefaultInProduction({
          config: { auth: { secret: defaultAuthSecret }, env: 'dev' },
          defaultAuthSecret,
        }),
      ).not.toThrow();

      expect(() =>
        ensureAuthSecretIsNotDefaultInProduction({
          config: { auth: { secret: 'a-non-default-secure-secret' }, env: 'production' },
          defaultAuthSecret,
        }),
      ).not.toThrow();
    });
  });
});
