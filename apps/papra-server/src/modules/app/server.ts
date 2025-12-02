import type { GlobalDependencies, ServerInstanceGenerics } from './server.types';
import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { createApiKeyMiddleware } from '../api-keys/api-keys.middlewares';
import { parseConfig } from '../config/config';
import { createDocumentSearchServices } from '../documents/document-search/document-search.registry';
import { createDocumentStorageService } from '../documents/storage/documents.storage.services';
import { createEmailsServices } from '../emails/emails.services';
import { createLoggerMiddleware } from '../shared/logger/logger.middleware';
import { createSubscriptionsServices } from '../subscriptions/subscriptions.services';
import { createTaskServices } from '../tasks/tasks.services';
import { createTrackingServices } from '../tracking/tracking.services';
import { createAuthEmailsServices } from './auth/auth.emails.services';
import { getAuth } from './auth/auth.services';
import { setupDatabase } from './database/database';
import { createEventServices } from './events/events.services';
import { createCorsMiddleware } from './middlewares/cors.middleware';
import { registerErrorMiddleware } from './middlewares/errors.middleware';
import { createTimeoutMiddleware } from './middlewares/timeout.middleware';
import { registerRoutes } from './server.routes';
import { registerStaticAssetsRoutes } from './static-assets/static-assets.routes';

async function createGlobalDependencies(partialDeps: Partial<GlobalDependencies>): Promise<GlobalDependencies> {
  const config = partialDeps.config ?? (await parseConfig()).config;
  const db = partialDeps.db ?? setupDatabase(config.database).db;
  const emailsServices = createEmailsServices({ config });
  const trackingServices = partialDeps.trackingServices ?? createTrackingServices({ config });
  const eventServices = partialDeps.eventServices ?? createEventServices();
  const auth = partialDeps.auth ?? getAuth({ db, config, authEmailsServices: createAuthEmailsServices({ emailsServices }), eventServices }).auth;
  const subscriptionsServices = createSubscriptionsServices({ config });
  const taskServices = partialDeps.taskServices ?? createTaskServices({ config });
  const documentsStorageService = partialDeps.documentsStorageService ?? createDocumentStorageService({ documentStorageConfig: config.documentsStorage });
  const documentSearchServices = partialDeps.documentSearchServices ?? createDocumentSearchServices({ db, config });

  return {
    documentsStorageService,
    config,
    db,
    auth,
    emailsServices,
    subscriptionsServices,
    trackingServices,
    taskServices,
    documentSearchServices,
    eventServices,
  };
}

export async function createServer(initialDeps: Partial<GlobalDependencies> = {}) {
  const dependencies = await createGlobalDependencies(initialDeps);
  const { config, trackingServices, db } = dependencies;

  const app = new Hono<ServerInstanceGenerics>({ strict: true });

  app.use(createLoggerMiddleware({ config }));
  app.use(createCorsMiddleware({ config }));
  app.use(createTimeoutMiddleware({ config }));
  app.use(secureHeaders());

  registerErrorMiddleware({ app });
  registerStaticAssetsRoutes({ app, config });

  app.use(createApiKeyMiddleware({ db }));

  registerRoutes({ app, ...dependencies });

  return {
    app,
    shutdown: async () => {
      await trackingServices.shutdown();
    },
  };
}
