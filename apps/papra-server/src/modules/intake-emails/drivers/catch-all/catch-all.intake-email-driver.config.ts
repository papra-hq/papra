import type { ConfigDefinition } from 'figue';

import { z } from 'zod';

export const catchAllIntakeEmailDriverConfig = {
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails when using the `catch-all` driver',
    schema: z.string(),
    default: 'papra.local',
    env: 'INTAKE_EMAILS_CATCH_ALL_DOMAIN',
  },
} as const satisfies ConfigDefinition;
