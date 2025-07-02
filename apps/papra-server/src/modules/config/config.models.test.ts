import type { DeepPartial } from '@corentinth/chisels';
import type { Config } from './config.types';
import { describe, expect, test } from 'vitest';
import { getPublicConfig } from './config.models';
import { overrideConfig } from './config.test-utils';

describe('config models', () => {
  describe('getPublicConfig', () => {
    test(`the public config only contains the followings info:
        - auth.isEmailVerificationRequired Whether email verification is required
        - auth.isPasswordResetEnabled Whether password reset is enabled
        - auth.isRegistrationEnabled Whether registration is enabled
        - auth.showLegalLinksOnAuthPage Whether to show Papra legal links on the auth pages
        - auth.providers.*.isEnabled Wether a oauth provider is enabled
        - documents.deletedExpirationDelayInDays The delay in days before a deleted document is permanently deleted
        - intakeEmails.isEnabled Whether intake emails are enabled
        - auth.providers.email.isEnabled Whether email/password authentication is enabled
        
        Any other config should not be exposed.`, () => {
      const config = overrideConfig({
        foo: 'bar',
        auth: {
          bar: 'baz',
          isEmailVerificationRequired: true,
          isPasswordResetEnabled: true,
          isRegistrationEnabled: true,
          showLegalLinksOnAuthPage: true,
          providers: {
            github: {
              isEnabled: true,
            },
            google: {
              isEnabled: false,
            },
            customs: [],
          },
        },
        documents: {
          deletedDocumentsRetentionDays: 30,
        },
        intakeEmails: {
          isEnabled: true,
        },
      } as DeepPartial<Config>);

      expect(getPublicConfig({ config })).to.eql({
        publicConfig: {
          auth: {
            isEmailVerificationRequired: true,
            isPasswordResetEnabled: true,
            isRegistrationEnabled: true,
            showLegalLinksOnAuthPage: true,
            providers: {
              github: {
                isEnabled: true,
              },
              google: {
                isEnabled: false,
              },
              customs: [],
              email: {
                isEnabled: true,
              },
            },
          },
          documents: {
            deletedDocumentsRetentionDays: 30,
          },
          intakeEmails: {
            isEnabled: true,
          },
        },
      });
    });
  });
});
