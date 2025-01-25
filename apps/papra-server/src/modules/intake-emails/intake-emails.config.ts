import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

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
  webhookSecret: {
    doc: 'The secret to use when verifying webhooks',
    schema: z.string(),
    default: 'change-me',
    env: 'INTAKE_EMAILS_WEBHOOK_SECRET',
  },
} as const satisfies ConfigDefinition;
