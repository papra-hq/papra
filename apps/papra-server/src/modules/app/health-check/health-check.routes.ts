import type { ServerInstance } from '../server.types';
import { getDb } from '../database/database.models';
import { isDatabaseHealthy } from './health-check.repository';

export function registerHealthCheckRoutes({ app }: { app: ServerInstance }) {
  setupPingRoute({ app });
  setupHealthCheckRoute({ app });
}

function setupPingRoute({ app }: { app: ServerInstance }) {
  app.get('/api/ping', context => context.json({ status: 'ok' }));
}

function setupHealthCheckRoute({ app }: { app: ServerInstance }) {
  app.get('/api/health', async (context) => {
    const { db } = getDb({ context });

    const isHealthy = await isDatabaseHealthy({ db });

    const isEverythingOk = isHealthy;
    const status = isEverythingOk ? 'ok' : 'error';
    const statusCode = isEverythingOk ? 200 : 500;

    return context.json(
      {
        isDatabaseHealthy: isHealthy,
        isEverythingOk,
        status,
      },
      statusCode,
    );
  });
}
