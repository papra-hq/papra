import type { ConfigDefinition } from 'figue';
import process from 'node:process';
import { safelySync } from '@corentinth/chisels';
import { defineConfig } from 'figue';
import { z } from 'zod';
import { authConfig } from '../app/auth/auth.config';
import { documentsConfig } from '../documents/documents.config';
import { createLogger } from '../shared/logger/logger';
import { tasksConfig } from '../tasks/tasks.config';
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
  documents: documentsConfig,
  documentsStorage: documentStorageConfig,
  auth: authConfig,
  tasks: tasksConfig,
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
