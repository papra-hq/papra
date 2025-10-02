import type { Context } from '../../app/server.types';
import type { Config } from '../../config/config.types';
import { createMiddleware } from 'hono/factory';
import { routePath } from 'hono/route';
import { getHeader, getIpFromHeaders } from '../headers/headers.models';
import { generateId } from '../random/ids';
import { createLogger, wrapWithLoggerContext } from './logger';

const logger = createLogger({ namespace: 'app' });

export function createLoggerMiddleware({ config }: { config: Config }) {
  return createMiddleware(async (context: Context, next) => {
    const requestId = getHeader({ context, name: 'x-request-id' }) ?? generateId({ prefix: 'req' });
    const ip = getIpFromHeaders({ context, headerNames: config.auth.ipAddressHeaders });

    await wrapWithLoggerContext(
      {
        requestId,
      },
      async () => {
        const requestedAt = new Date();

        await next();

        const durationMs = new Date().getTime() - requestedAt.getTime();

        logger.info(
          {
            status: context.res.status,
            method: context.req.method,
            path: context.req.path,
            routePath: routePath(context),
            userAgent: getHeader({ context, name: 'User-Agent' }),
            durationMs,
            ip,
          },
          'Request completed',
        );
      },
    );
  });
}
