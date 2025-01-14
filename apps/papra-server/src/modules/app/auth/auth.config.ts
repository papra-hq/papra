import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const authConfig = {
  secret: {
    doc: 'The secret for the auth',
    schema: z.string(),
    default: 'change-me-for-god-sake',
    env: 'AUTH_SECRET',
  },
  isRegistrationEnabled: {
    doc: 'Whether registration is enabled',
    schema: z
      .string()
      .trim()
      .toLowerCase()
      .transform(x => x === 'true')
      .pipe(z.boolean()),
    default: 'true',
    env: 'AUTH_IS_REGISTRATION_ENABLED',
  },
  providers: {
    github: {
      clientId: {
        doc: 'The client id for Github OAuth',
        schema: z.string(),
        default: 'set-me',
        env: 'AUTH_PROVIDERS_GITHUB_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The client secret for Github OAuth',
        schema: z.string(),
        default: 'set-me',
        env: 'AUTH_PROVIDERS_GITHUB_CLIENT_SECRET',
      },
    },
  },
} as const satisfies ConfigDefinition;
