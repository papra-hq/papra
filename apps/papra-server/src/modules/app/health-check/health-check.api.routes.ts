import type { ApiDependencies } from '../server.types';
import { defineApiRoute } from '../../api/api.routes';
import { healthCheckContract, pingContract } from './health-check.api.contracts';
import { isDatabaseHealthy } from './health-check.repository';

export function buildHealthCheckApiRoutes(deps: ApiDependencies) {
  return [setupPingRoute(), setupHealthCheckRoute(deps)];
}

function setupPingRoute() {
  return defineApiRoute({
    contract: pingContract,
    handler: async () => ({
      status: 200,
      contentType: 'application/json',
      body: { status: 'ok' as const },
    }),
  });
}

function setupHealthCheckRoute({ db }: ApiDependencies) {
  return defineApiRoute({
    contract: healthCheckContract,
    handler: async () => {
      const isHealthy = await isDatabaseHealthy({ db });

      const isEverythingOk = isHealthy;
      const status = isEverythingOk ? 'ok' : 'error';
      const statusCode = isEverythingOk ? 200 : 500;

      return {
        status: statusCode,
        contentType: 'application/json',
        body: {
          isDatabaseHealthy: isHealthy,
          isEverythingOk,
          status,
        } as const,
      };
    },
  });
}
