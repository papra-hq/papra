import type { RouteDefinitionContext } from '../app/server.types';
import { getPublicConfig } from './config.models';

export function registerConfigRoutes(context: RouteDefinitionContext) {
  setupGetPublicConfigRoute(context);
}

function setupGetPublicConfigRoute({ app, config }: RouteDefinitionContext) {
  const { publicConfig } = getPublicConfig({ config });

  app.get('/api/config', async (context) => {
    return context.json({ config: publicConfig });
  });
}
