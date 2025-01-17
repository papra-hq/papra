import type { ServerInstance } from '../app/server.types';
import { getConfig, getPublicConfig } from './config.models';

export async function registerConfigPublicRoutes({ app }: { app: ServerInstance }) {
  setupGetPublicConfigRoute({ app });
}

function setupGetPublicConfigRoute({ app }: { app: ServerInstance }) {
  app.get('/api/config', async (context) => {
    const { config } = getConfig({ context });

    const { publicConfig } = getPublicConfig({ config });

    return context.json({ config: publicConfig });
  });
}
