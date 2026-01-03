import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../../config/config.schemas';
import { parseJson } from '../../intake-emails/intake-emails.schemas';
import { DEFAULT_AUTH_SECRET } from './auth.constants';

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
    doc: 'The secret for the auth, it should be at least 32 characters long, you can generate a secure one using `openssl rand -hex 48`',
    schema: z.string({ required_error: 'Please provide an auth secret using the AUTH_SECRET environment variable, you can use `openssl rand -hex 48` to generate a secure one' }).min(32),
    default: DEFAULT_AUTH_SECRET,
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
  firstUserAsAdmin: {
    doc: 'Automatically assign the admin role to the first user who registers. This is useful for initial setup of self-hosted instances where you need an admin account to manage the platform.',
    schema: booleanishSchema,
    default: true,
    env: 'AUTH_FIRST_USER_AS_ADMIN',
  },
  ipAddressHeaders: {
    doc: `The header, or comma separated list of headers, to use to get the real IP address of the user, use for rate limiting. Make sur to use a non-spoofable header, one set by your proxy.
- If behind a standard proxy, you might want to set this to "x-forwarded-for".
- If behind Cloudflare, you might want to set this to "cf-connecting-ip".`,
    schema: z.union([
      z.string(),
      z.array(z.string()),
    ]).transform(value => (typeof value === 'string' ? value.split(',').map(v => v.trim()) : value)),
    default: ['x-forwarded-for'],
    env: 'AUTH_IP_ADDRESS_HEADERS',
  },
  forbiddenEmailDomains: {
    doc: 'A comma separated list of email domains that are forbidden for registration (e.g. "foo.com,bar.com"), if set, it will override the default forbidden domains.',
    schema: z.union([
      z.string(),
      z.array(z.string()),
    ]).transform((value) => {
      const asArray = typeof value === 'string' ? value.split(',') : value;
      const cleaned = asArray.map(v => v.trim().toLowerCase()).filter(v => v.length > 0);
      return new Set(cleaned);
    }),
    default: ['papra.app', 'papra.email', 'owlrelay.email', 'callback.email', 'clb.email'],
    env: 'AUTH_FORBIDDEN_EMAIL_DOMAINS',
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
