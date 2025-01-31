import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const databaseConfig = {
  url: {
    doc: 'The URL of the database',
    schema: z.string().url(),
    default: 'file:./db.sqlite',
    env: 'DATABASE_URL',
  },
  authToken: {
    doc: 'The auth token for the database',
    schema: z.string().optional(),
    default: undefined,
    env: 'DATABASE_AUTH_TOKEN',
  },
  encryptionKey: {
    doc: 'The encryption key for the database. If not provided, the database will not be encrypted. Use with caution as if lost, the data will be unrecoverable.',
    schema: z.string().optional(),
    default: undefined,
    env: 'DATABASE_ENCRYPTION_KEY',
  },
} as const satisfies ConfigDefinition;
