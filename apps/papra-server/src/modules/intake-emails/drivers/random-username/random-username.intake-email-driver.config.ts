import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const randomUsernameIntakeEmailDriverConfig = {
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails when using the random username driver',
    schema: z.string(),
    default: 'papra.email',
    env: 'INTAKE_EMAILS_EMAIL_GENERATION_DOMAIN',
  },
} as const satisfies ConfigDefinition;
