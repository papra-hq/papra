import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../../config/config.schemas';
import { parseJson } from '../../intake-emails/intake-emails.schemas';

const customOAuthProviderSchema = z.object({
  providerId: z.string(),
  providerName: z.string(),
  providerIconUrl: z.string().url().optional(),

  clientId: z.string(),
  clientSecret: z.string(),

  scopes: z.array(z.string()).optional(),
  redirectURI: z.string().optional(),
  tokenUrl: z.string().optional(),
  userInfoUrl: z.string().optional(),
  responseType: z.string().optional(),
  prompt: z.enum(['select_account', 'consent', 'login', 'none']).optional(),
  pkce: booleanishSchema.optional(),
  accessType: z.string().optional(),
  discoveryUrl: z.string().optional(),
  type: z.enum(['oauth2', 'oidc']).optional(),
  authorizationUrl: z.string().optional(),
});

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
    email: {
      isEnabled: {
        doc: 'Whether email/password authentication is enabled',
        schema: booleanishSchema,
        default: true,
        env: 'AUTH_PROVIDERS_EMAIL_IS_ENABLED',
      },
    },
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
    customs: {
      doc: 'The list of custom OAuth providers, as a JSON string, see https://www.better-auth.com/docs/plugins/generic-oauth#configuration for more details',
      schema: z.union([
        z.string().transform(parseJson).pipe(z.array(customOAuthProviderSchema)),
        z.array(customOAuthProviderSchema),
      ]),
      default: [],
      env: 'AUTH_PROVIDERS_CUSTOMS',
    },
  },
} as const satisfies ConfigDefinition;
