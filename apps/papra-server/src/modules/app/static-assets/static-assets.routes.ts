import type { Context } from 'hono';
import type { Config } from '../../config/config.types';
import type { ServerInstance } from '../server.types';
import { readFile } from 'node:fs/promises';
import { safely } from '@corentinth/chisels';
import { serveStatic } from '@hono/node-server/serve-static';
import { createLogger } from '../../shared/logger/logger';
import { isApiRoute } from './static-assets.models';

const logger = createLogger({ namespace: 'static-assets.routes' });

export function registerStaticAssetsRoutes({ app, config }: { app: ServerInstance; config: Config }) {
  if (!config.server.servePublicDir) {
    return;
  }

  app
    .use(
      '*',
      async (context, next) => {
        const staticMiddleware = serveStatic({
          root: './public',
          // Disable index.html fallback to let the next middleware handle it
          index: `unexisting-file-${Math.random().toString(36).substring(2)}`,
        });

        return staticMiddleware(context as Context<any, string>, next);
      },
    )
    .use(
      '*',
      async (context, next) => {
        if (isApiRoute({ path: context.req.path })) {
          return next();
        }

        const [indexHtmlContent, error] = await safely(readFile('public/index.html', 'utf-8'));

        if (error) {
          logger.error({ error }, 'Error reading index.html file');
          return next(); // let the 404 handler take care of it
        }

        return context.html(indexHtmlContent);
      },
    );
}
