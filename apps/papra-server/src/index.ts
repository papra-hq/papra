import process, { env } from 'node:process';
import { serve } from '@hono/node-server';
import { getAuth } from './modules/app/auth/auth.services';
import { setupDatabase } from './modules/app/database/database';
import { createServer } from './modules/app/server';
import { parseConfig } from './modules/config/config';
import { createLogger } from './modules/shared/logger/logger';

const logger = createLogger({ namespace: 'app-server' });

const { config } = parseConfig({ env });
const { db } = setupDatabase(config.database);
const { auth } = getAuth({ db, config });

const { app } = createServer({ config, db, auth });

const server = serve(
  {
    fetch: app.fetch,
    port: config.server.port,
  },
  ({ port }) => logger.info({ port }, 'Server started'),
);

process.on('SIGINT', async () => {
  server.close();

  process.exit(0);
});
