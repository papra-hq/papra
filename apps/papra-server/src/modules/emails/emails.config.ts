import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../config/config.schemas';

export const emailsConfig = {
  resendApiKey: {
    doc: 'The API key for Resend',
    schema: z.string(),
    default: 'set-me',
    env: 'RESEND_API_KEY',
  },
  fromEmail: {
    doc: 'The email address to send emails from',
    schema: z.string(),
    default: 'Papra <auth@mail.papra.app>',
    env: 'EMAILS_FROM_ADDRESS',
  },
  dryRun: {
    doc: 'Whether to run the email service in dry run mode',
    schema: booleanishSchema,
    default: false,
    env: 'EMAILS_DRY_RUN',
  },
} as const satisfies ConfigDefinition;
