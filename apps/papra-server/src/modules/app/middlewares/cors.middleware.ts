import type { Config } from '../../config/config.types';
import { cors } from 'hono/cors';
import { first } from 'lodash-es';

export function createCorsMiddleware({ config }: { config: Config }) {
  return cors({
    origin: (origin) => {
      const allowedOrigins = config.server.corsOrigins;

      if (first(allowedOrigins) === '*' && allowedOrigins.length === 1) {
        return origin;
      }

      return allowedOrigins.find(allowedOrigin => allowedOrigin === origin);
    },
    credentials: true,
  });
}
