import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema, urlSchema } from '../config/config.schemas';
import { coercedPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { IN_MS } from '../shared/units';
import { tasksDriverNames } from './drivers/tasks-driver.constants';

export const tasksConfig = {
  persistence: {
    driverName: {
      doc: `The driver to use for the tasks persistence, values can be one of: ${tasksDriverNames.map(x => `\`${x}\``).join(', ')}. Using the memory driver is enough when running a single instance of the server.`,
      schema: v.picklist(tasksDriverNames),
      default: 'memory',
      env: 'TASKS_PERSISTENCE_DRIVER',
    },
    drivers: {
      libSql: {
        url: {
          doc: 'The URL of the LibSQL database, can be either a file-protocol url with a local path or a remote LibSQL database URL',
          schema: urlSchema,
          default: 'file:./tasks-db.sqlite',
          env: 'TASKS_PERSISTENCE_DRIVERS_LIBSQL_URL',
        },
        authToken: {
          doc: 'The auth token for the LibSQL database',
          schema: v.optional(v.string()),
          default: undefined,
          env: 'TASKS_PERSISTENCE_DRIVERS_LIBSQL_AUTH_TOKEN',
        },
        migrateWithPragma: {
          doc: 'Whether to include the PRAGMA statements when setting up the LibSQL database schema.',
          schema: booleanishSchema,
          default: true,
          env: 'TASKS_PERSISTENCE_DRIVERS_LIBSQL_MIGRATE_WITH_PRAGMA',
        },
        pollIntervalMs: {
          doc: 'The interval at which the task persistence driver polls for new tasks',
          schema: coercedPositiveIntegerSchema,
          default: 1 * IN_MS.SECOND,
          env: 'TASKS_PERSISTENCE_DRIVERS_LIBSQL_POLL_INTERVAL_MS',
        },
      },
    },
  },
  worker: {
    id: {
      doc: 'The id of the task worker, used to identify the worker in the Cadence cluster in case of multiple workers, should be unique per instance',
      schema: v.optional(v.string()),
      env: ['TASKS_WORKER_ID', 'DYNO', 'RENDER_SERVICE_ID', 'FLY_MACHINE_ID'],
    },
  },
  hardDeleteExpiredDocuments: {
    cron: {
      doc: 'The cron schedule for the task to hard delete expired "soft deleted" documents',
      schema: v.string(),
      default: '0 0 * * *',
      env: 'DOCUMENTS_HARD_DELETE_EXPIRED_DOCUMENTS_CRON',
    },
    runOnStartup: {
      doc: 'Whether the task to hard delete expired "soft deleted" documents should run on startup',
      schema: booleanishSchema,
      default: true,
      env: 'DOCUMENTS_HARD_DELETE_EXPIRED_DOCUMENTS_RUN_ON_STARTUP',
    },
  },
  expireInvitations: {
    cron: {
      doc: 'The cron schedule for the task to expire invitations',
      schema: v.string(),
      default: '0 0 * * *',
      env: 'ORGANIZATIONS_EXPIRE_INVITATIONS_CRON',
    },
    runOnStartup: {
      doc: 'Whether the task to expire invitations should run on startup',
      schema: booleanishSchema,
      default: true,
      env: 'ORGANIZATIONS_EXPIRE_INVITATIONS_RUN_ON_STARTUP',
    },
  },
  purgeExpiredOrganizations: {
    cron: {
      doc: 'The cron schedule for the task to purge expired soft-deleted organizations',
      schema: v.string(),
      default: '0 1 * * *',
      env: 'ORGANIZATIONS_PURGE_EXPIRED_ORGANIZATIONS_CRON',
    },
    runOnStartup: {
      doc: 'Whether the task to purge expired soft-deleted organizations should run on startup',
      schema: booleanishSchema,
      default: true,
      env: 'ORGANIZATIONS_PURGE_EXPIRED_ORGANIZATIONS_RUN_ON_STARTUP',
    },
  },
} as const satisfies ConfigDefinition;
