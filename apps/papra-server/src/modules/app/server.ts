import type { Config } from '../config/config.types';
import type { Auth } from './auth/auth.services';
import type { Database } from './database/database.types';
import type { ServerInstanceGenerics } from './server.types';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { parseConfig } from '../config/config';
import { getAuth } from './auth/auth.services';
import { corsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { timeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';
import { registerStaticAssetsRoutes } from './static-assets/static-assets.routes';

export function createServer({
  db,
  config = parseConfig().config,
  auth = getAuth({ config, db }).auth,
}: {
  db: Database;
  config?: Config;
  auth?: Auth;
}) {
  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(loggerMiddleware);

  app.use((context, next) => {
    context.set('config', config);
    context.set('db', db);
    context.set('auth', auth);

    return next();
  });

  app.use(corsMiddleware);
  app.use(timeoutMiddleware);
  app.use(secureHeaders());

  registerErrorMiddleware({ app });
  registerStaticAssetsRoutes({ app });

  registerRoutes({ app });

  return {
    app,
  };
}
