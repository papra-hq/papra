import type { AppConfigDefinition } from './config.types';
import process from 'node:process';
import { memoizeOnce, safelySync } from '@corentinth/chisels';
import { loadConfig } from 'c12';
import { defineConfig } from 'figue';
import * as v from 'valibot';
import { authConfig } from '../app/auth/auth.config';
import { ensureAuthSecretIsNotDefaultInProduction } from '../app/auth/auth.config.models';
import { databaseConfig } from '../app/database/database.config';
import { customPropertiesConfig } from '../custom-properties/custom-properties.config';
import { documentSearchConfig } from '../documents/document-search/document-search.config';
import { documentsConfig } from '../documents/documents.config';
import { documentStorageConfig } from '../documents/storage/document-storage.config';
import { emailsConfig } from '../emails/emails.config';
import { ingestionFolderConfig } from '../ingestion-folders/ingestion-folders.config';
import { intakeEmailsConfig } from '../intake-emails/intake-emails.config';
import { organizationsConfig } from '../organizations/organizations.config';
import { organizationPlansConfig } from '../plans/plans.config';
import { createLogger } from '../shared/logger/logger';
import { coercedPositiveIntegerSchema, strictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { IN_MS } from '../shared/units';
import { subscriptionsConfig } from '../subscriptions/subscriptions.config';
import { tagsConfig } from '../tags/tags.config';
import { tasksConfig } from '../tasks/tasks.config';
import { trackingConfig } from '../tracking/tracking.config';
import { exitProcessDueToConfigError, validateParsedConfig } from './config.models';
import { appSchemeSchema, booleanishSchema, coercedUrlListSchema, urlSchema } from './config.schemas';
import { getCommitInfo } from './config.usecases';

export const configDefinition = {
  env: {
    doc: 'The application environment.',
    schema: v.picklist(['development', 'production', 'test']),
    default: 'development',
    env: 'NODE_ENV',
    showInDocumentation: false,
  },
  version: {
    doc: 'The application version, used for display in the about page. Set by dockerfile build args during release builds.',
    schema: v.string(),
    default: 'dev',
    env: 'PAPRA_VERSION',
  },
  gitCommitSha: {
    doc: 'The git commit hash, used for display in the about page. Set by dockerfile build args during release builds.',
    schema: v.string(),
    default: 'unknown',
    env: 'GIT_COMMIT',
  },
  gitCommitDate: {
    doc: 'The git commit date (ISO 8601 format), used for display in the about page. Set by dockerfile build args during release builds.',
    schema: v.string(),
    default: 'unknown',
    env: 'BUILD_DATE',
  },
  processMode: {
    doc: 'The process mode: "all" runs both web and worker, "web" runs only the API server, "worker" runs only background tasks',
    schema: v.picklist(['all', 'web', 'worker']),
    default: 'all',
    env: 'PROCESS_MODE',
  },
  appBaseUrl: {
    doc: 'The base URL of the application. Will override the client baseUrl and server baseUrl when set. Use this one over the client and server baseUrl when the server is serving the client assets (like in docker).',
    schema: v.optional(urlSchema),
    env: 'APP_BASE_URL',
    default: undefined,
  },
  client: {
    baseUrl: {
      doc: 'The URL of the client, when using docker, prefer using the `APP_BASE_URL` environment variable instead.',
      schema: urlSchema,
      default: 'http://localhost:3000',
      env: 'CLIENT_BASE_URL',
    },
  },
  server: {
    baseUrl: {
      doc: 'The base URL of the server, when using docker, prefer using the `APP_BASE_URL` environment variable instead.',
      schema: urlSchema,
      default: 'http://localhost:1221',
      env: 'SERVER_BASE_URL',
    },
    trustedOrigins: {
      doc: 'A comma separated list of origins that are trusted to make requests to the server. The client baseUrl (CLIENT_BASE_URL) is automatically added by default, no need to add it to the list.',
      schema: coercedUrlListSchema,
      default: [],
      env: 'TRUSTED_ORIGINS',
    },
    trustedAppSchemes: {
      doc: 'A comma separated list of app schemes that are trusted for authentication. For example: "papra://,exp://". Note, setting this value will override the default schemes, so make sure to include them if needed.',
      schema: appSchemeSchema,
      default: ['papra://', 'exp://'],
      env: 'TRUSTED_APP_SCHEMES',
    },
    port: {
      doc: 'The port to listen on when using node server',
      schema: v.pipe(coercedPositiveIntegerSchema, v.minValue(1024), v.maxValue(65535)),
      default: 1221,
      env: 'PORT',
    },
    hostname: {
      doc: 'The hostname to bind to when using node server',
      schema: v.string(),
      default: '0.0.0.0',
      env: 'SERVER_HOSTNAME',
    },
    defaultRouteTimeoutMs: {
      doc: 'The maximum time in milliseconds for a route to complete before timing out',
      schema: coercedPositiveIntegerSchema,
      default: 20 * IN_MS.SECOND,
      env: 'SERVER_API_ROUTES_TIMEOUT_MS',
    },
    routeTimeouts: {
      doc: 'Route-specific timeout overrides. Allows setting different timeouts for specific HTTP method and route paths.',
      schema: v.array(
        v.object({
          method: v.picklist(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
          route: v.string(),
          timeoutMs: strictlyPositiveIntegerSchema,
        }),
      ),
      default: [
        {
          method: 'POST',
          route: '/api/organizations/:organizationId/documents',
          timeoutMs: 5 * IN_MS.MINUTE,
        },
      ],
      showInDocumentation: false, // mainly used for internal overrides
    },
    corsOrigins: {
      doc: 'The CORS origin for the api server',
      schema: coercedUrlListSchema,
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
  documentSearch: documentSearchConfig,
  auth: authConfig,
  ingestionFolder: ingestionFolderConfig,
  tasks: tasksConfig,
  intakeEmails: intakeEmailsConfig,
  emails: emailsConfig,
  organizations: organizationsConfig,
  organizationPlans: organizationPlansConfig,
  subscriptions: subscriptionsConfig,
  tags: tagsConfig,
  customProperties: customPropertiesConfig,
  tracking: trackingConfig,
} as const satisfies AppConfigDefinition;

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

  const { gitCommitSha, gitCommitDate } = await getCommitInfo();

  const [configResult, configError] = safelySync(() => defineConfig(configDefinition, {
    envSource: env,
    defaults: [
      { gitCommitSha, gitCommitDate },
      configFromFile,
    ],
  }));

  if (configError) {
    exitProcessDueToConfigError({ error: configError, logger });
  }

  const { config } = configResult;

  validateParsedConfig({
    config,
    logger,
    validators: [
      ensureAuthSecretIsNotDefaultInProduction,
    ],
  });

  return { config };
}

// Permit to load the default config, regardless of environment variables, and config files
// memoized to avoid re-parsing the config definition
export const loadDryConfig = memoizeOnce(() => {
  const { config } = defineConfig(configDefinition);

  return { config };
});
