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

const documentsStorageService = createDocumentStorageService({ config });

const taskServices = createTaskServices({ config });
const { app } = await createServer({ config, db, taskServices, documentsStorageService });

const server = serve(
  {
    fetch: app.fetch,
    port: config.server.port,
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

process.on('SIGINT', async () => {
  server.close();
  client.close();

  process.exit(0);
});
