import type { ServerInstance } from '../server.types';
import { readFile } from 'node:fs/promises';
import { serveStatic } from '@hono/node-server/serve-static';
import { memoize } from 'lodash-es';
import { getConfig } from '../../config/config.models';

const getIndexContent = memoize(async () => {
  const index = await readFile('public/index.html', 'utf-8');

  return index;
});

export function registerAssetsMiddleware({ app }: { app: ServerInstance }) {
  app
    .use(
      '*',
      async (context, next) => {
        const { config } = getConfig({ context });

        if (!config.server.servePublicDir) {
          return next();
        }

        return serveStatic({
          root: './public',
          index: `unexisting-file-${Math.random().toString(36).substring(2, 15)}`, // Disable index.html fallback to let the next middleware handle it
        })(context, next);
      },
    )
    .use(
      '*',
      async (context, next) => {
        const { config } = getConfig({ context });

        if (!config.server.servePublicDir) {
          return next();
        }

        if (context.req.path.startsWith('/api/')) {
          return next();
        }

        const indexHtmlContent = await getIndexContent();

        return context.html(indexHtmlContent);
      },
    );
}
