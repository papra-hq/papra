import type { ServerInstance } from '../server.types';
import { formatPublicErrorPayload, isCustomError } from '../../shared/errors/errors';
import { createLogger } from '../../shared/logger/logger';

const logger = createLogger({ namespace: 'middlewares:error' });

export function registerErrorMiddleware({ app }: { app: ServerInstance }) {
  app.onError((error, context) => {
    logger.error({ error }, error.message ?? 'An error occurred');

    if (isCustomError(error) && !error.isInternal) {
      return context.json(
        formatPublicErrorPayload(error),
        error.statusCode,
      );
    }

    if (error.message === 'Malformed JSON in request body') {
      return context.json(
        formatPublicErrorPayload({
          message: 'Invalid request body',
          code: 'server.invalid_request.malformed_json',
        }),
        400,
      );
    }

    return context.json(
      formatPublicErrorPayload({
        message: 'An error occurred',
        code: 'internal.error',
      }),
      500,
    );
  });

  app.notFound((context) => {
    return context.json(
      formatPublicErrorPayload({
        message: 'API route not found',
        code: 'api.not-found',
      }),
      404,
    );
  });
}
