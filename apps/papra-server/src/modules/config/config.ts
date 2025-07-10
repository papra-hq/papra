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
import { ingestionFolderConfig } from '../ingestion-folders/ingestion-folders.config';
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
  appBaseUrl: {
    doc: 'The base URL of the application. Will override the client baseUrl and server baseUrl when set. Use this one over the client and server baseUrl when the server is serving the client assets (like in docker).',
    schema: z.string().url().optional(),
    env: 'APP_BASE_URL',
    default: undefined,
  },
  client: {
    baseUrl: {
      doc: 'The URL of the client, when using docker, prefer using the `APP_BASE_URL` environment variable instead.',
      schema: z.string().url(),
      default: 'http://localhost:3000',
      env: 'CLIENT_BASE_URL',
    },
  },
  server: {
    baseUrl: {
      doc: 'The base URL of the server, when using docker, prefer using the `APP_BASE_URL` environment variable instead.',
      schema: z.string().url(),
      default: 'http://localhost:1221',
      env: 'SERVER_BASE_URL',
    },
    trustedOrigins: {
      doc: 'A comma separated list of origins that are trusted to make requests to the server. The client baseUrl (CLIENT_BASE_URL) is automatically added by default, no need to add it to the list.',
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
  ingestionFolder: ingestionFolderConfig,
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
