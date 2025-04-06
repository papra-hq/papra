import type { ConfigDefinition } from 'figue';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { loadConfig } from 'c12';
import { defineConfig } from 'figue';
import { memoize } from 'lodash-es';
import { z } from 'zod';
import { authConfig } from '../app/auth/auth.config';
import { databaseConfig } from '../app/database/database.config';
import { documentsConfig } from '../documents/documents.config';
import { documentStorageConfig } from '../documents/storage/document-storage.config';
import { emailsConfig } from '../emails/emails.config';
import { intakeEmailsConfig } from '../intake-emails/intake-emails.config';
import { organizationsConfig } from '../organizations/organizations.config';
import { organizationPlansConfig } from '../plans/plans.config';
import { createLogger } from '../shared/logger/logger';
import { subscriptionsConfig } from '../subscriptions/subscriptions.config';
import { tasksConfig } from '../tasks/tasks.config';
import { trackingConfig } from '../tracking/tracking.config';
import { booleanishSchema, trustedOriginsSchema } from './config.schemas';

export const configDefinition = {
  env: {
    doc: 'The application environment.',
    schema: z.enum(['development', 'production', 'test']),
    default: 'development',
    env: 'NODE_ENV',
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
  server: {
    baseUrl: {
      doc: 'The base URL of the server',
      schema: z.string().url(),
      default: 'http://localhost:1221',
      env: 'SERVER_BASE_URL',
    },
    trustedOrigins: {
      doc: 'A comma separated list of origins that are trusted to make requests to the server, it\'ll include the baseUrl by default. You can set it to "*" to allow all origins (not recommended).',
      schema: trustedOriginsSchema,
      default: [],
      env: 'TRUSTED_ORIGINS',
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
      doc: 'Whether to serve the public directory (default as true when using docker)',
      schema: booleanishSchema,
      default: false,
      env: 'SERVER_SERVE_PUBLIC_DIR',
    },
  },

  database: databaseConfig,
  documents: documentsConfig,
  documentsStorage: documentStorageConfig,
  auth: authConfig,
  tasks: tasksConfig,
  intakeEmails: intakeEmailsConfig,
  emails: emailsConfig,
  organizations: organizationsConfig,
  organizationPlans: organizationPlansConfig,
  subscriptions: subscriptionsConfig,
  tracking: trackingConfig,
} as const satisfies ConfigDefinition;

const logger = createLogger({ namespace: 'config' });

export async function parseConfig({ env = process.env }: { env?: Record<string, string | undefined> } = {}) {
  const { config: configFromFile } = await loadConfig({
    name: 'papra',
    rcFile: false,
    globalRc: false,
    dotenv: false,
    packageJson: false,
    envName: false,
    cwd: env.PAPRA_CONFIG_DIR ?? process.cwd(),
  });

  const [configResult, configError] = safelySync(() => defineConfig(configDefinition, { envSource: env, defaults: configFromFile }));

  if (configError) {
    logger.error({ error: configError }, `Invalid config: ${configError.message}`);
    process.exit(1);
  }

  const { config } = configResult;

  return { config };
}

// Permit to load the default config, regardless of environment variables, and config files
// memoized to avoid re-parsing the config definition
export const loadDryConfig = memoize(() => {
  const { config } = defineConfig(configDefinition);

  return { config };
});
