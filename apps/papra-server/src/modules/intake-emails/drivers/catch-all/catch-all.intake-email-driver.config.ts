import type { ConfigDefinition } from 'figue';

import * as v from 'valibot';

export const catchAllIntakeEmailDriverConfig = {
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails when using the `catch-all` driver',
    schema: v.string(),
    default: 'papra.local',
    env: 'INTAKE_EMAILS_CATCH_ALL_DOMAIN',
  },
} as const satisfies ConfigDefinition;
