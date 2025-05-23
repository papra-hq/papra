/* eslint-disable antfu/no-top-level-await */
import process, { env } from 'node:process';
import { serve } from '@hono/node-server';
import { setupDatabase } from './modules/app/database/database';
import { ensureLocalDatabaseDirectoryExists } from './modules/app/database/database.services';
import { createServer } from './modules/app/server';
import { parseConfig } from './modules/config/config';
import { createIngestionFolderWatcher } from './modules/ingestion-folders/ingestion-folders.usecases';
import { createLogger } from './modules/shared/logger/logger';
import { createTaskScheduler } from './modules/tasks/task-scheduler';
import { taskDefinitions } from './modules/tasks/tasks.defiitions';

const logger = createLogger({ namespace: 'app-server' });

const { config } = await parseConfig({ env });

await ensureLocalDatabaseDirectoryExists({ config });
const { db, client } = setupDatabase(config.database);

const { app } = await createServer({ config, db });
const { taskScheduler } = createTaskScheduler({ config, taskDefinitions, tasksArgs: { db } });

const server = serve(
  {
    fetch: app.fetch,
    port: config.server.port,
  },
  ({ port }) => logger.info({ port }, 'Server started'),
);

if (config.ingestionFolder.isEnabled) {
  const { startWatchingIngestionFolders } = createIngestionFolderWatcher({
    config,
    db,
  });

  await startWatchingIngestionFolders();
}

taskScheduler.start();

process.on('SIGINT', async () => {
  server.close();
  taskScheduler.stop();
  client.close();

  process.exit(0);
});
