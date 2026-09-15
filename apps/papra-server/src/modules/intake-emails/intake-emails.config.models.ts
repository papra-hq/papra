import type { Config } from '../config/config.types';
import { createIntakeEmailMissingWebhookSecretError } from './intake-emails.errors';

export function ensureIntakeEmailWebhookSecretisSetWhenIntakeEmailsAreEnabled({
  config,
}: {
  config: Config;
}) {
  if (config.intakeEmails.isEnabled && !config.intakeEmails.webhookSecret) {
    throw createIntakeEmailMissingWebhookSecretError();
  }
}
