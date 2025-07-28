import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../config/config.schemas';

export const tasksConfig = {
  persistence: {
    driver: {
      doc: 'The driver to use for the tasks persistence',
      schema: z.enum(['memory']),
      default: 'memory',
      env: 'TASKS_PERSISTENCE_DRIVER',
    },
  },
  worker: {
    id: {
      doc: 'The id of the task worker, used to identify the worker in the Cadence cluster in case of multiple workers',
      schema: z.string().optional(),
      env: 'TASKS_WORKER_ID',
    },
  },
  hardDeleteExpiredDocuments: {
    enabled: {
      doc: 'Whether the task to hard delete expired "soft deleted" documents is enabled',
      schema: booleanishSchema,
      default: true,
      env: 'DOCUMENTS_HARD_DELETE_EXPIRED_DOCUMENTS_ENABLED',
    },
    cron: {
      doc: 'The cron schedule for the task to hard delete expired "soft deleted" documents',
      schema: z.string(),
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
    enabled: {
      doc: 'Whether the task to expire invitations is enabled',
      schema: booleanishSchema,
      default: true,
      env: 'ORGANIZATIONS_EXPIRE_INVITATIONS_ENABLED',
    },
    cron: {
      doc: 'The cron schedule for the task to expire invitations',
      schema: z.string(),
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
} as const satisfies ConfigDefinition;
