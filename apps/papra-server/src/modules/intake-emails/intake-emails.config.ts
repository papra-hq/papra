import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../config/config.schemas';
import { CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME } from './drivers/catch-all/catch-all.intake-email-driver';
import { catchAllIntakeEmailDriverConfig } from './drivers/catch-all/catch-all.intake-email-driver.config';
import { intakeEmailDrivers } from './drivers/intake-emails.drivers';
import { owlrelayIntakeEmailDriverConfig } from './drivers/owlrelay/owlrelay.intake-email-driver.config';
import { intakeEmailUsernameConfig } from './username-drivers/intake-email-username.config';

export const intakeEmailsConfig = {
  isEnabled: {
    doc: 'Whether intake emails are enabled',
    schema: booleanishSchema,
    default: false,
    env: 'INTAKE_EMAILS_IS_ENABLED',
  },
  webhookSecret: {
    doc: 'The secret to use when verifying webhooks',
    schema: z.string(),
    default: 'change-me',
    env: 'INTAKE_EMAILS_WEBHOOK_SECRET',
  },
  driver: {
    doc: `The driver to use when generating email addresses for intake emails, value can be one of: ${Object.keys(intakeEmailDrivers).map(x => `\`${x}\``).join(', ')}.`,
    schema: z.enum(Object.keys(intakeEmailDrivers) as [string, ...string[]]),
    default: CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME,
    env: 'INTAKE_EMAILS_DRIVER',
  },
  drivers: {
    owlrelay: owlrelayIntakeEmailDriverConfig,
    catchAll: catchAllIntakeEmailDriverConfig,
  },
  username: intakeEmailUsernameConfig,
} as const satisfies ConfigDefinition;
