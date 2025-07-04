import type { Context } from '../../app/server.types';
import { createMiddleware } from 'hono/factory';
import { getHeader } from '../headers/headers.models';
import { generateId } from '../random/ids';
import { createLogger, wrapWithLoggerContext } from './logger';

const logger = createLogger({ namespace: 'app' });

export function createLoggerMiddleware() {
  return createMiddleware(async (context: Context, next) => {
    const requestId = getHeader({ context, name: 'x-request-id' });

    await wrapWithLoggerContext(
      {
        requestId: requestId ?? generateId({ prefix: 'req' }),
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
            routePath: context.req.routePath,
            userAgent: getHeader({ context, name: 'User-Agent' }),
            durationMs,
          },
          'Request completed',
        );
      },
    );
  });
}
