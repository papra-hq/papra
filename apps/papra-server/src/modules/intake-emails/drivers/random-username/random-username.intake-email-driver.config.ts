import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const randomUsernameIntakeEmailDriverConfig = {
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails',
    schema: z.string(),
    default: 'papra.email',
  },
} as const satisfies ConfigDefinition;
