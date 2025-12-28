import type { Config } from '../../config/config.types';
import type { Context } from '../server.types';
import { createMiddleware } from 'hono/factory';
import { routePath } from 'hono/route';
import { createError } from '../../shared/errors/errors';

function getTimeoutForRoute({
  defaultRouteTimeoutMs,
  routeTimeouts,
  method,
  path,
}: {
  defaultRouteTimeoutMs: number;
  routeTimeouts: { method: string; route: string; timeoutMs: number }[];
  method: string;
  path: string;
}): number {
  const matchingRoute = routeTimeouts.find((routeConfig) => {
    if (routeConfig.method !== method) {
      return false;
    }

    if (routeConfig.route !== path) {
      return false;
    }

    return true;
  });

  return matchingRoute?.timeoutMs ?? defaultRouteTimeoutMs;
}

export function createTimeoutMiddleware({ config }: { config: Config }) {
  return createMiddleware(async (context: Context, next) => {
    const method = context.req.method;
    const path = routePath(context, -1); // Get the last matched route path, without the -1 we get /* for all routes
    const { defaultRouteTimeoutMs, routeTimeouts } = config.server;

    const timeoutMs = getTimeoutForRoute({ defaultRouteTimeoutMs, routeTimeouts, method, path });

    let timerId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => reject(
        createError({
          code: 'api.timeout',
          message: 'The request timed out',
          statusCode: 504,
        }),
      ), timeoutMs);
    });

    try {
      await Promise.race([next(), timeoutPromise]);
    } finally {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    }
  });
}
