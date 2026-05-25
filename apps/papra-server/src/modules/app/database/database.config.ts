import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { urlSchema } from '../../config/config.schemas';

export const databaseConfig = {
  url: {
    doc: 'The URL of the database (default as "file:./app-data/db/db.sqlite" when using docker)',
    schema: urlSchema,
    default: 'file:./db.sqlite',
    env: 'DATABASE_URL',
  },
  authToken: {
    doc: 'The auth token for the database',
    schema: v.optional(v.string()),
    default: undefined,
    env: 'DATABASE_AUTH_TOKEN',
  },
  encryptionKey: {
    doc: 'The encryption key for the database. If not provided, the database will not be encrypted at rest. Use with caution as if lost, the data will be unrecoverable.',
    schema: v.optional(v.string()),
    default: undefined,
    env: 'DATABASE_ENCRYPTION_KEY',
  },
} as const satisfies ConfigDefinition;
