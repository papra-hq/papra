import type { Config } from '../../config/config.types';
import { createMiddleware } from 'hono/factory';

export function createConfigMiddleware({ config }: { config: Config }) {
  return createMiddleware(async (context, next) => {
    context.set('config', config);
    return next();
  });
}
