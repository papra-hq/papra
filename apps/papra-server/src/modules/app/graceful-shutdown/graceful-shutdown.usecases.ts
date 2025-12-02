import type { Logger } from '../../shared/logger/logger';
import type { ShutdownServices } from './graceful-shutdown.services';
import process from 'node:process';
import { createLogger } from '../../shared/logger/logger';

async function gracefulShutdown({ signal, cause, shutdownServices, logger, exitCode = 0 }: { signal?: string; cause: string; shutdownServices: ShutdownServices; logger: Logger; exitCode?: number }) {
  logger.info({ signal, cause }, 'Shutting down gracefully...');

  await shutdownServices.executeShutdownHandlers();

  logger.info('Shutdown complete, exiting process');

  // Let logs flush
  setTimeout(() => process.exit(exitCode), 500);
}

export function registerShutdownHooks({ shutdownServices, logger = createLogger({ namespace: 'graceful-shutdown' }) }: { shutdownServices: ShutdownServices; logger?: Logger }) {
  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    void gracefulShutdown({ cause: 'uncaughtException', shutdownServices, logger, exitCode: 1 });
  });

  process.on('unhandledRejection', (error) => {
    logger.error({ error }, 'Unhandled promise rejection');
    void gracefulShutdown({ cause: 'unhandledRejection', shutdownServices, logger, exitCode: 1 });
  });

  process.on('SIGINT', () => void gracefulShutdown({ cause: 'Interrupt signal', signal: 'SIGINT', shutdownServices, logger }));
  process.on('SIGTERM', () => void gracefulShutdown({ cause: 'Termination signal', signal: 'SIGTERM', shutdownServices, logger }));
}
