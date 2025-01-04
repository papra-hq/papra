import type { Context } from '../server.types';
import { cors } from 'hono/cors';
import { first } from 'lodash-es';
import { getConfig } from '../../config/config.models';

export const corsMiddleware = cors({
  origin: (origin, context: Context) => {
    const { config } = getConfig({ context });
    const allowedOrigins = config.server.corsOrigins;

    if (first(allowedOrigins) === '*' && allowedOrigins.length === 1) {
      return origin;
    }

    return allowedOrigins.find(allowedOrigin => allowedOrigin === origin);
  },
  credentials: true,
});
