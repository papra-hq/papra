import { describe, expect, test } from 'vitest';
import { ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled } from './intake-emails.config.models';
import type { Config } from '../config/config.types';
import { createIntakeEmailMissingWebhookSecretError } from './intake-emails.errors';

describe('intake-emails.config.models', () => {
  describe('ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled', () => {
    test("make sure that the webhook secret is set when intake emails are enabled, just check the presence of the secret, not its validity, it's handled by the config schema", () => {
      expect(() =>
        ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled({
          config: { intakeEmails: { isEnabled: true, webhookSecret: 'secret' } } as Config,
        }),
      ).not.toThrow();

      expect(() =>
        ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled({
          config: { intakeEmails: { isEnabled: true, webhookSecret: undefined } } as Config,
        }),
      ).toThrow(createIntakeEmailMissingWebhookSecretError());

      expect(() =>
        ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled({
          config: { intakeEmails: { isEnabled: false, webhookSecret: undefined } } as Config,
        }),
      ).not.toThrow();

      expect(() =>
        ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled({
          config: { intakeEmails: { isEnabled: false, webhookSecret: 'secret' } } as Config,
        }),
      ).not.toThrow();
    });
  });
});
