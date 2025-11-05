import type { Logger } from '@crowlog/logger';
import type { ShutdownHandlerRegistration } from '../graceful-shutdown/graceful-shutdown.services';
import type { Database } from './database.types';
import { createClient } from '@libsql/client';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { Kysely } from 'kysely';
import { createLogger } from '../../shared/logger/logger';

export function setupDatabase({
  url,
  authToken,
  encryptionKey,
  registerShutdownHandler,
  logger = createLogger({ namespace: 'database' }),
}: {
  url: string;
  authToken?: string;
  encryptionKey?: string;
  registerShutdownHandler?: ShutdownHandlerRegistration;
  logger?: Logger;
}) {
  const client = createClient({ url, authToken, encryptionKey });

  const db = new Kysely<Database>({
    // @ts-expect-error https://github.com/tursodatabase/kysely-libsql/issues/12
    dialect: new LibsqlDialect({ client }),
    log: (event) => {
      const meta = {
        sql: event.query.sql,
        durationMs: event.queryDurationMillis,
      };

      if (event.level === 'error') {
        logger.error({ error: event.error, ...meta }, 'Database query error');

        return;
      }

      logger.debug({ ...meta }, 'Database query executed');
    },
  });

  registerShutdownHandler?.({
    id: 'database-client-close',
    handler: () => client.close(),
  });

  return {
    db,
    client,
  };
}
