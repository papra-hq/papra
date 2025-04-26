import type { RouteDefinitionContext } from '../app/server.types';
import { getPublicConfig } from './config.models';

export async function registerConfigRoutes(context: RouteDefinitionContext) {
  setupGetPublicConfigRoute(context);
}

function setupGetPublicConfigRoute({ app, config }: RouteDefinitionContext) {
  app.get('/api/config', async (context) => {
    const { publicConfig } = getPublicConfig({ config });

    return context.json({ config: publicConfig });
  });
}
