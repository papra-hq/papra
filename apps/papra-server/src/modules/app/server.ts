import type { Config } from '../config/config.types';
import type { Database } from './database/database.types';
import type { ServerInstanceGenerics } from './server.types';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { parseConfig } from '../config/config';
import { createEmailsServices } from '../emails/emails.services';
import { loggerMiddleware } from '../shared/logger/logger.middleware';
import { createAuthEmailsServices } from './auth/auth.emails.services';
import { getAuth } from './auth/auth.services';
import { corsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { timeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';
import { registerStaticAssetsRoutes } from './static-assets/static-assets.routes';

export function createServer({
  db,
  config = parseConfig().config,
}: {
  db: Database;
  config?: Config;
}) {
  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(loggerMiddleware);

  app.use((context, next) => {
    context.set('config', config);
    context.set('db', db);

    const emailsServices = createEmailsServices({ config });
    const authEmailsServices = createAuthEmailsServices({ emailsServices });
    const { auth } = getAuth({ db, config, authEmailsServices });

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
