import { createMiddleware } from 'hono/factory';
import { getHeader } from '../headers/headers.models';
import { generateId } from '../random';
import { createLogger, wrapWithLoggerContext } from './logger';

const logger = createLogger({ namespace: 'app' });

export const loggerMiddleware = createMiddleware(async (context, next) => {
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
