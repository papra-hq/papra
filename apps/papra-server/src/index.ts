/* eslint-disable antfu/no-top-level-await */
import process, { env } from 'node:process';
import { serve } from '@hono/node-server';
import { setupDatabase } from './modules/app/database/database';
import { ensureLocalDatabaseDirectoryExists } from './modules/app/database/database.services';
import { registerEventHandlers } from './modules/app/events/events.handlers';
import { createEventServices } from './modules/app/events/events.services';
import { createGracefulShutdownService } from './modules/app/graceful-shutdown/graceful-shutdown.services';
import { createServer } from './modules/app/server';
import { parseConfig } from './modules/config/config';
import { createDocumentStorageService } from './modules/documents/storage/documents.storage.services';
import { createIngestionFolderWatcher } from './modules/ingestion-folders/ingestion-folders.usecases';
import { addToGlobalLogContext, createLogger } from './modules/shared/logger/logger';
import { registerTaskDefinitions } from './modules/tasks/tasks.definitions';
import { createTaskServices } from './modules/tasks/tasks.services';
import { createTrackingServices } from './modules/tracking/tracking.services';

const logger = createLogger({ namespace: 'app-server' });

const { config } = await parseConfig({ env });

addToGlobalLogContext({ processMode: config.processMode });

const isWebMode = config.processMode === 'all' || config.processMode === 'web';
const isWorkerMode = config.processMode === 'all' || config.processMode === 'worker';

logger.info({ processMode: config.processMode, isWebMode, isWorkerMode }, 'Starting application');

// Shutdown callback collector
const shutdownService = createGracefulShutdownService({ logger });
const { registerShutdownHandler } = shutdownService;

await ensureLocalDatabaseDirectoryExists({ config });
const { db } = setupDatabase({ ...config.database, registerShutdownHandler });

const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

const taskServices = createTaskServices({ config });
await taskServices.initialize();

const trackingServices = createTrackingServices({ config });
const eventServices = createEventServices();
registerEventHandlers({ eventServices, trackingServices });

if (isWebMode) {
  const { app } = await createServer({ config, db, taskServices, documentsStorageService, eventServices, trackingServices });

  const server = serve(
    {
      fetch: app.fetch,
      port: config.server.port,
      hostname: config.server.hostname,
    },
    ({ port }) => logger.info({ port }, 'Server started'),
  );

  registerShutdownHandler({
    id: 'web-server-close',
    handler: () => {
      server.close();
    },
  });
}

if (isWorkerMode) {
  if (config.ingestionFolder.isEnabled) {
    const { startWatchingIngestionFolders } = createIngestionFolderWatcher({
      taskServices,
      config,
      db,
      documentsStorageService,
    });

    await startWatchingIngestionFolders();
  }

  await registerTaskDefinitions({ taskServices, db, config, documentsStorageService });

  taskServices.start();
  logger.info('Worker started');
}

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  setTimeout(() => process.exit(1), 1000); // Give the logger time to flush before exiting
});

process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled promise rejection');
  setTimeout(() => process.exit(1), 1000); // Give the logger time to flush before exiting
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal, shutting down gracefully...');

  await shutdownService.executeShutdownHandlers();

  logger.info('Shutdown complete, exiting process');
  process.exit(0);
}

process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
