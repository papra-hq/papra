import type { GlobalDependencies } from './modules/app/server.types';
import type { Config } from './modules/config/config.types';
import type { Logger } from './modules/shared/logger/logger';
import { env } from 'node:process';
import { createAuthEmailsServices } from './modules/app/auth/auth.emails.services';
import { getAuth } from './modules/app/auth/auth.services';
import { setupDatabase } from './modules/app/database/database';
import { ensureLocalDatabaseDirectoryExists } from './modules/app/database/database.services';
import { registerEventHandlers } from './modules/app/events/events.handlers';
import { createEventServices } from './modules/app/events/events.services';
import { createGracefulShutdownService } from './modules/app/graceful-shutdown/graceful-shutdown.services';
import { getProcessMode } from './modules/app/process.models';
import { createServer } from './modules/app/server';
import { parseConfig } from './modules/config/config';
import { createDocumentSearchServices } from './modules/documents/document-search/document-search.registry';
import { createDocumentStorageService } from './modules/documents/storage/documents.storage.services';
import { createEmailsServices } from './modules/emails/emails.services';
import { createIngestionFolderWatcher } from './modules/ingestion-folders/ingestion-folders.usecases';
import { addToGlobalLogContext, createLogger } from './modules/shared/logger/logger';
import { createSubscriptionsServices } from './modules/subscriptions/subscriptions.services';
import { registerTaskDefinitions } from './modules/tasks/tasks.definitions';
import { createTaskServices } from './modules/tasks/tasks.services';
import { createTrackingServices } from './modules/tracking/tracking.services';

async function startWebMode({ logger, ...dependencies }: { logger: Logger } & GlobalDependencies) {
  const server = createServer(dependencies);

  server.start({
    onStarted: ({ port }) => logger.info({ port }, 'Server started'),
  });
}

async function startWorkerMode({ logger, config, db, taskServices, documentsStorageService }: { logger: Logger } & GlobalDependencies) {
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

async function buildServices({ config }: { config: Config }): Promise<GlobalDependencies> {
  const shutdownServices = createGracefulShutdownService();

  await ensureLocalDatabaseDirectoryExists({ config });
  const { db } = setupDatabase({ ...config.database, shutdownServices });

  const documentsStorageService = createDocumentStorageService({ documentStorageConfig: config.documentsStorage });
  const taskServices = createTaskServices({ config });
  const trackingServices = createTrackingServices({ config, shutdownServices });
  const eventServices = createEventServices();
  const emailsServices = createEmailsServices({ config });
  const authEmailsServices = createAuthEmailsServices({ emailsServices });
  const { auth } = getAuth({ db, config, authEmailsServices, eventServices });
  const subscriptionsServices = createSubscriptionsServices({ config });
  const documentSearchServices = createDocumentSearchServices({ db, config });

  // --- Services initialization
  await taskServices.initialize();
  registerEventHandlers({ eventServices, trackingServices });

  return {
    config,
    db,
    shutdownServices,
    documentsStorageService,
    taskServices,
    trackingServices,
    eventServices,
    emailsServices,
    auth,
    subscriptionsServices,
    documentSearchServices,
  };
}

export async function startApp() {
  const logger = createLogger({ namespace: 'app-server' });

  const { config } = await parseConfig({ env });

  const { isWebMode, isWorkerMode, processMode } = getProcessMode({ config });

  addToGlobalLogContext({ processMode });

  logger.info({ isWebMode, isWorkerMode }, 'Starting application');

  const globalDependencies = await buildServices({ config });

  if (isWebMode) {
    await startWebMode({ logger, ...globalDependencies });
  }

  if (isWorkerMode) {
    await startWorkerMode({ logger, ...globalDependencies });
  }

  return {
    shutdownServices: globalDependencies.shutdownServices,
  };
}
