import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../../config/config.schemas';

export const authConfig = {
  secret: {
    doc: 'The secret for the auth',
    schema: z.string(),
    default: 'change-me-for-god-sake',
    env: 'AUTH_SECRET',
  },
  isRegistrationEnabled: {
    doc: 'Whether registration is enabled',
    schema: booleanishSchema,
    default: true,
    env: 'AUTH_IS_REGISTRATION_ENABLED',
  },
  isPasswordResetEnabled: {
    doc: 'Whether password reset is enabled',
    schema: booleanishSchema,
    default: true,
    env: 'AUTH_IS_PASSWORD_RESET_ENABLED',
  },
  isEmailVerificationRequired: {
    doc: 'Whether email verification is required',
    schema: booleanishSchema,
    default: false,
    env: 'AUTH_IS_EMAIL_VERIFICATION_REQUIRED',
  },
  showLegalLinksOnAuthPage: {
    doc: 'Whether to show Papra legal links on the auth pages (terms of service, privacy policy), useless for self-hosted instances',
    schema: booleanishSchema,
    default: false,
    env: 'AUTH_SHOW_LEGAL_LINKS',
  },
  providers: {
    github: {
      isEnabled: {
        doc: 'Whether Github OAuth is enabled',
        schema: booleanishSchema,
        default: false,
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
    google: {
      isEnabled: {
        doc: 'Whether Google OAuth is enabled',
        schema: booleanishSchema,
        default: false,
        env: 'AUTH_PROVIDERS_GOOGLE_IS_ENABLED',
      },
      clientId: {
        doc: 'The client id for Google OAuth',
        schema: z.string(),
        default: 'set-me',
        env: 'AUTH_PROVIDERS_GOOGLE_CLIENT_ID',
      },
      clientSecret: {
        doc: 'The client secret for Google OAuth',
        schema: z.string(),
        default: 'set-me',
        env: 'AUTH_PROVIDERS_GOOGLE_CLIENT_SECRET',
      },
    },

  },
} as const satisfies ConfigDefinition;
