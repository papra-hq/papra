import type { Config } from '../../config/config.types';
import type { ServerInstance } from '../server.types';
import { readFile } from 'node:fs/promises';
import { serveStatic } from '@hono/node-server/serve-static';
import { memoize } from 'lodash-es';
import { isApiRoute } from './static-assets.models';

const getIndexContent = memoize(async () => {
  const index = await readFile('public/index.html', 'utf-8');

  return index;
});

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

        return staticMiddleware(context, next);
      },
    )
    .use(
      '*',
      async (context, next) => {
        if (isApiRoute({ path: context.req.path })) {
          return next();
        }

        const indexHtmlContent = await getIndexContent();

        return context.html(indexHtmlContent);
      },
    );
}
