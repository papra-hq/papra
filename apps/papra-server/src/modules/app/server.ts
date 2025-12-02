import type { GlobalDependencies, ServerInstanceGenerics } from './server.types';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { createApiKeyMiddleware } from '../api-keys/api-keys.middlewares';
import { createLoggerMiddleware } from '../shared/logger/logger.middleware';
import { createCorsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { createTimeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';
import { registerStaticAssetsRoutes } from './static-assets/static-assets.routes';

export function createServer(dependencies: GlobalDependencies) {
  const { config, db, shutdownServices } = dependencies;

  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(createLoggerMiddleware({ config }));
  app.use(createCorsMiddleware({ config }));
  app.use(createTimeoutMiddleware({ config }));
  app.use(secureHeaders());

  registerErrorMiddleware({ app });
  registerStaticAssetsRoutes({ app, config });

  app.use(createApiKeyMiddleware({ db }));

  registerRoutes({ app, ...dependencies });

  return {
    app,
    start: ({ onStarted }: { onStarted?: (args: { port: number }) => void }) => {
      const server = serve(
        {
          fetch: app.fetch,
          port: config.server.port,
          hostname: config.server.hostname,
        },
        onStarted,
      );

      shutdownServices.registerShutdownHandler({
        id: 'web-server-close',
        handler: () => {
          server.close();
        },
      });
    },
  };
}
