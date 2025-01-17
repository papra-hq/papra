import type { Config } from './config.types';
import { describe, expect, test } from 'vitest';
import { getPublicConfig } from './config.models';

describe('config models', () => {
  describe('getPublicConfig', () => {
    test(`the public config only contains the followings info:
        - auth.isEmailVerificationRequired Whether email verification is required
        - auth.isPasswordResetEnabled Whether password reset is enabled
        - auth.isRegistrationEnabled Whether registration is enabled
        - auth.providers.*.isEnabled Wether a oauth provider is enabled
        
        Any other config should not be exposed.`, () => {
      const config = {
        foo: 'bar',
        auth: {
          bar: 'baz',
          isEmailVerificationRequired: true,
          isPasswordResetEnabled: true,
          isRegistrationEnabled: true,
          providers: {
            github: {
              isEnabled: true,
            },
          },
        },
      } as unknown as Config;

      expect(getPublicConfig({ config })).to.eql({
        publicConfig: {
          auth: {
            isEmailVerificationRequired: true,
            isPasswordResetEnabled: true,
            isRegistrationEnabled: true,
            providers: {
              github: {
                isEnabled: true,
              },
            },
          },
        },
      });
    });
  });
});
