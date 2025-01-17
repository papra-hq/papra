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
  isPasswordResetEnabled: {
    doc: 'Whether password reset is enabled',
    schema: z
      .string()
      .trim()
      .toLowerCase()
      .transform(x => x === 'true')
      .pipe(z.boolean()),
    default: 'true',
    env: 'AUTH_IS_PASSWORD_RESET_ENABLED',
  },
  isEmailVerificationRequired: {
    doc: 'Whether email verification is required',
    schema: z
      .string()
      .trim()
      .toLowerCase()
      .transform(x => x === 'true')
      .pipe(z.boolean()),
    default: 'true',
    env: 'AUTH_IS_EMAIL_VERIFICATION_REQUIRED',
  },
  providers: {
    github: {
      isEnabled: {
        doc: 'Whether Github OAuth is enabled',
        schema: z
          .string()
          .trim()
          .toLowerCase()
          .transform(x => x === 'true')
          .pipe(z.boolean()),
        default: 'true',
        env: 'AUTH_PROVIDERS_GITHUB_IS_ENABLED',
      },
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
