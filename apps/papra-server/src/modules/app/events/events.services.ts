import type { Logger } from '../../shared/logger/logger';
import type { AppEvents } from './events.types';
import { safely } from '@corentinth/chisels';
import { createError } from '../../shared/errors/errors';
import { createLogger, wrapWithLoggerContext } from '../../shared/logger/logger';
import { generateId } from '../../shared/random/ids';
import { isNil } from '../../shared/utils';

type HandlerMeta = {
  emittedAt: Date;
  eventId: string;
};

export type EventServices = ReturnType<typeof createEventServices<AppEvents>>;

export function createEventServices<T extends Record<string, Record<string, unknown>> = AppEvents>({ logger = createLogger({ namespace: 'events-services' }) }: { logger?: Logger } = {}) {
  const handlers = new Map<keyof T, { handlerName: string; handler: (payload: T[keyof T], meta: HandlerMeta) => Promise<void> | void }[]>();

  return {
    onEvent<K extends keyof T>({ eventName, handlerName, handler }: {
      eventName: K;
      handlerName: string;
      handler: (payload: T[K], meta: HandlerMeta) => Promise<void>;
    }) {
      const isDuplicateName = handlers.get(eventName)?.some(h => h.handlerName === handlerName) ?? false;

      if (isDuplicateName) {
        throw createError({
          message: `Duplicate handler name "${handlerName}" for event "${String(eventName)}"`,
          code: 'events.duplicate_handler_name',
          statusCode: 500,
          isInternal: true,
        });
      }

      handlers.set(eventName, [
        ...(handlers.get(eventName) ?? []),
        { handlerName, handler: handler as (payload: T[keyof T], meta: HandlerMeta) => Promise<void> },
      ]);
    },

    emitEvent<K extends keyof T>({
      eventName,
      payload,
      eventId = generateId({ prefix: 'evt' }),
      now = new Date(),
    }: {
      eventName: K;
      payload: T[K];
      eventId?: string;
      now?: Date;
    }) {
      const eventHandlers = handlers.get(eventName);

      if (isNil(eventHandlers) || eventHandlers.length === 0) {
        logger.debug(`No handlers for event: ${String(eventName)}`);
        return;
      }

      logger.debug({
        eventName,
        eventId,
        handlerCount: eventHandlers.length,
        handlerNames: eventHandlers.map(({ handlerName }) => handlerName),
      }, 'Event emitted');

      setImmediate(async () => {
        await Promise.allSettled(eventHandlers.map(async ({ handlerName, handler }) => {
          await wrapWithLoggerContext({ eventId, eventName, handlerName }, async () => {
            const [, error] = await safely(async () => handler(payload, { emittedAt: now, eventId }));

            if (error) {
              logger.error({ error }, 'Error in event handler');
              return;
            }

            logger.info('Event handler executed successfully');
          });
        }));
      });
    },
  };
}
