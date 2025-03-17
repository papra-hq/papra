import type { GlobalDependencies, ServerInstanceGenerics } from './server.types';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { parseConfig } from '../config/config';
import { createEmailsServices } from '../emails/emails.services';
import { createLoggerMiddleware } from '../shared/logger/logger.middleware';
import { createAuthEmailsServices } from './auth/auth.emails.services';
import { getAuth } from './auth/auth.services';
import { setupDatabase } from './database/database';
import { createCorsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { createTimeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';
import { registerStaticAssetsRoutes } from './static-assets/static-assets.routes';

function createGlobalDependencies(partialDeps: Partial<GlobalDependencies>): GlobalDependencies {
  const config = partialDeps.config ?? parseConfig().config;
  const db = partialDeps.db ?? setupDatabase(config.database).db;
  const emailsServices = createEmailsServices({ config });
  const auth = partialDeps.auth ?? getAuth({ db, config, authEmailsServices: createAuthEmailsServices({ emailsServices }) }).auth;

  return {
    config,
    db,
    auth,
    emailsServices,
  };
}

export function createServer(initialDeps: Partial<GlobalDependencies>) {
  const dependencies = createGlobalDependencies(initialDeps);
  const { config } = dependencies;

  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(createLoggerMiddleware());
  app.use(createCorsMiddleware({ config }));
  app.use(createTimeoutMiddleware({ config }));
  app.use(secureHeaders());

  registerErrorMiddleware({ app });
  registerStaticAssetsRoutes({ app, config });

  registerRoutes({ app, ...dependencies });

  return {
    app,
  };
}
