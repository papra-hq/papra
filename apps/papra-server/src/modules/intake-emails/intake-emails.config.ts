import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { intakeEmailDrivers } from './drivers/intake-emails.drivers';
import { RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME } from './drivers/random-username/random-username.intake-email-driver';
import { randomUsernameIntakeEmailDriverConfig } from './drivers/random-username/random-username.intake-email-driver.config';

export const intakeEmailsConfig = {
  isEnabled: {
    doc: 'Whether intake emails are enabled',
    schema: z
      .string()
      .trim()
      .toLowerCase()
      .transform(x => x === 'true')
      .pipe(z.boolean()),
    default: 'false',
    env: 'INTAKE_EMAILS_IS_ENABLED',
  },
  emailGenerationDomain: {
    doc: 'The domain to use when generating email addresses for intake emails',
    schema: z.string(),
    default: 'papra.email',
    env: 'INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN',
  },
  driver: {
    doc: 'The driver to use when generating email addresses for intake emails',
    schema: z.enum(Object.keys(intakeEmailDrivers) as [string, ...string[]]),
    default: RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME,
    env: 'INTAKE_EMAILS_DRIVER',
  },
  webhookSecret: {
    doc: 'The secret to use when verifying webhooks',
    schema: z.string(),
    default: 'change-me',
    env: 'INTAKE_EMAILS_WEBHOOK_SECRET',
  },
  drivers: {
    randomUsername: randomUsernameIntakeEmailDriverConfig,
  },
} as const satisfies ConfigDefinition;
