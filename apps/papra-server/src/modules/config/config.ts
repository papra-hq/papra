import type { ConfigDefinition } from 'figue';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { defineConfig } from 'figue';
import { z } from 'zod';
import { authConfig } from '../app/auth/auth.config';
import { createLogger } from '../shared/logger/logger';
import { documentStorageConfig } from './fragments/document-storage.config';

export const configDefinition = {
  env: {
    doc: 'The application environment.',
    schema: z.enum(['development', 'production', 'test']),
    default: 'development',
    env: 'NODE_ENV',
  },
  server: {
    baseUrl: {
      doc: 'The base URL of the server',
      schema: z.string().url(),
      default: 'http://localhost:1221',
      env: 'SERVER_BASE_URL',
    },
    port: {
      doc: 'The port to listen on when using node server',
      schema: z.coerce.number().min(1024).max(65535),
      default: 1221,
      env: 'PORT',
    },
    routeTimeoutMs: {
      doc: 'The maximum time in milliseconds for a route to complete before timing out',
      schema: z.coerce.number().int().positive(),
      default: 20_000,
      env: 'SERVER_API_ROUTES_TIMEOUT_MS',
    },
    corsOrigins: {
      doc: 'The CORS origin for the api server',
      schema: z.union([
        z.string(),
        z.array(z.string()),
      ]).transform(value => (typeof value === 'string' ? value.split(',') : value)),
      default: ['http://localhost:3000'],
      env: 'SERVER_CORS_ORIGINS',
    },
    servePublicDir: {
      doc: 'Whether to serve the public directory',
      schema: z
        .string()
        .trim()
        .toLowerCase()
        .transform(x => x === 'true')
        .pipe(z.boolean()),
      default: 'false',
      env: 'SERVER_SERVE_PUBLIC_DIR',
    },
  },
  stripe: {
    apiSecretKey: {
      doc: 'The Stripe API key',
      schema: z.string(),
      default: '',
      env: 'STRIPE_API_SECRET_KEY',
    },
    webhookSecret: {
      doc: 'The Stripe webhook secret',
      schema: z.string(),
      default: '',
      env: 'STRIPE_WEBHOOK_SECRET',
    },
  },
  database: {
    url: {
      doc: 'The URL of the database',
      schema: z.string().url(),
      default: 'file:./db.sqlite',
      env: 'DATABASE_URL',
    },
    authToken: {
      doc: 'The auth token for the database',
      schema: z.string(),
      default: '',
      env: 'DATABASE_AUTH_TOKEN',
    },
  },
  email: {
    resendApiToken: {
      doc: 'The API token for Resend',
      schema: z.string(),
      default: '',
      env: 'RESEND_API_TOKEN',
    },
    dryRun: {
      doc: 'Whether to run in dry run mode',
      schema: z
        .string()
        .trim()
        .toLowerCase()
        .transform(x => x === 'true')
        .pipe(z.boolean()),
      default: 'false',
      env: 'EMAIL_DRY_RUN',
    },
  },
  client: {
    baseUrl: {
      doc: 'The URL of the client',
      schema: z.string().url(),
      default: 'http://localhost:3000',
      env: 'CLIENT_BASE_URL',
    },
    oauthRedirectUrl: {
      doc: 'The URL to redirect to after OAuth',
      schema: z.string().url(),
      default: 'http://localhost:3000/confirm',
      env: 'CLIENT_OAUTH_REDIRECT_URL',
    },
  },
  documentsStorage: documentStorageConfig,
  auth: authConfig,
  authLegacy: {
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
    jwtSecret: {
      doc: 'The secret to use for JWT',
      schema: z.string(),
      default: 'W7ZjXge0MeSyGmmSBMMqi2WvWzuLhmfexktisUte5cKYTLR986juWJOZDzzSaoEA',
      env: 'AUTH_JWT_SECRET',
    },
    jwtRefreshSecret: {
      doc: 'The secret to use for JWT refresh tokens',
      schema: z.string(),
      default: '4vLvdiXWt9cfywzCVUyRx5QdH0XDfY9KJroQJxeQcDJqlmDSUsTh6I3LMi4xrDso',
      env: 'AUTH_JWT_REFRESH_SECRET',
    },
    refreshTokenCookieSecret: {
      doc: 'The secret to use for the refresh token cookie',
      schema: z.string(),
      default: '1Su9CTJd728evq3EZVc5hK305g75hgRl22Gp1gH5xOUtMPUlMHiZR0rEM5W5Jlwi',
      env: 'AUTH_REFRESH_TOKEN_COOKIE_SECRET',
    },
    jwtMagicLinkSecret: {
      doc: 'The secret to use for JWT magic link tokens',
      schema: z.string(),
      default: 'sXI6o0E1jHsVTybE8G1hI9cFPxXRWLjLuyfVJMpWQj1o7xuvUI7iuUBf5RkzxwpJ',
      env: 'AUTH_JWT_MAGIC_LINK_SECRET',
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
      google: {
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
  },
} as const satisfies ConfigDefinition;

const logger = createLogger({ namespace: 'config' });

export function parseConfig({ env }: { env?: Record<string, string | undefined> } = {}) {
  const [configResult, configError] = safelySync(() => defineConfig(
    configDefinition,
    {
      envSource: env,
    },
  ));

  if (configError) {
    logger.error({ error: configError }, `Invalid config: ${configError.message}`);
    process.exit(1);
  }

  const { config } = configResult;

  return { config };
}
