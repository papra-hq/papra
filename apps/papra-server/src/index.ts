/* eslint-disable antfu/no-top-level-await */
import process, { env } from 'node:process';
import { serve } from '@hono/node-server';
import { setupDatabase } from './modules/app/database/database';
import { ensureLocalDatabaseDirectoryExists } from './modules/app/database/database.services';
import { createServer } from './modules/app/server';
import { parseConfig } from './modules/config/config';
import { createDocumentStorageService } from './modules/documents/storage/documents.storage.services';
import { createIngestionFolderWatcher } from './modules/ingestion-folders/ingestion-folders.usecases';
import { createLogger } from './modules/shared/logger/logger';
import { registerTaskDefinitions } from './modules/tasks/tasks.definitions';
import { createTaskServices } from './modules/tasks/tasks.services';

const logger = createLogger({ namespace: 'app-server' });

const { config } = await parseConfig({ env });

await ensureLocalDatabaseDirectoryExists({ config });
const { db, client } = setupDatabase(config.database);

const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });

const taskServices = createTaskServices({ config });
await taskServices.initialize();

const { app } = await createServer({ config, db, taskServices, documentsStorageService });

const server = serve(
  {
    fetch: app.fetch,
    port: config.server.port,
    hostname: config.server.hostname,
  },
  ({ port }) => logger.info({ port }, 'Server started'),
);

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

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');

  // Give the logger time to flush before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (error) => {
  logger.error({
    error,
  }, 'Unhandled promise rejection');

  // Give the logger time to flush before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');

  try {
    server.close();
    client.close();
    logger.info('Server shut down successfully');
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
  }

  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');

  try {
    server.close();
    client.close();
    logger.info('Server shut down successfully');
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
  }

  process.exit(0);
});
