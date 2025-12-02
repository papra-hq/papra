import type { Logger } from '../../shared/logger/logger';
import { createLogger } from '../../shared/logger/logger';

export type ShutdownHandlerConfig = {
  id: string;
  handler: () => void | Promise<void>;
};
export type ShutdownHandlerRegistration = (handlerConfig: ShutdownHandlerConfig) => void;

export type ShutdownServices = ReturnType<typeof createGracefulShutdownService>;

export function createGracefulShutdownService({ logger = createLogger({ namespace: 'graceful-shutdown' }) }: { logger?: Logger } = {}) {
  const shutdownHandlers: ShutdownHandlerConfig[] = [];

  return {
    registerShutdownHandler: (handler: ShutdownHandlerConfig) => {
      shutdownHandlers.push(handler);
    },

    async executeShutdownHandlers() {
      logger.info('Executing shutdown handlers');

      await Promise.allSettled(
        shutdownHandlers.map(async ({ handler, id }) => {
          try {
            await handler();
          } catch (error) {
            logger.error({ error, id }, 'Error executing shutdown handler');
          }
        }),
      );

      logger.info('All shutdown handlers executed');
    },
  };
}
