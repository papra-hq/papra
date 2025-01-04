import type { Config } from '../config/config.types';
import type { Database } from './database/database.types';
import type { ServerInstanceGenerics } from './server.types';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { parseConfig } from '../config/config';
import { createDatabaseMiddleware } from './database/database.middleware';
import { createConfigMiddleware } from './middlewares/config.middleware';
import { corsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { timeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';

export function createServer({ config = parseConfig().config, db }: { config?: Config; db: Database }) {
  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(loggerMiddleware);
  app.use(createConfigMiddleware({ config }));
  app.use(corsMiddleware);
  app.use(timeoutMiddleware);
  app.use(createDatabaseMiddleware({ db }));
  app.use(secureHeaders());

  registerErrorMiddleware({ app });

  registerRoutes({ app });

  return {
    app,
  };
}
