import type { RouteDefinitionContext } from '../server.types';
import { isDatabaseHealthy } from './health-check.repository';

export function registerHealthCheckRoutes(context: RouteDefinitionContext) {
  setupPingRoute(context);
  setupHealthCheckRoute(context);
}

function setupPingRoute({ app }: RouteDefinitionContext) {
  app.get('/api/ping', context => context.json({ status: 'ok' }));
}

function setupHealthCheckRoute({ app, db }: RouteDefinitionContext) {
  app.get('/api/health', async (context) => {
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
