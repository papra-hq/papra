import type { GlobalDependencies } from './server.types';

import { overrideConfig } from '../config/config.test-utils';
import { createDocumentSearchServices } from '../documents/document-search/document-search.registry';
import { createDocumentStorageService } from '../documents/storage/documents.storage.services';
import { createEmailsServices } from '../emails/emails.services';
import { createSubscriptionsServices } from '../subscriptions/subscriptions.services';
import { createInMemoryTaskServices } from '../tasks/tasks.test-utils';
import { createDummyTrackingServices } from '../tracking/tracking.services';
import { createAuthEmailsServices } from './auth/auth.emails.services';
import { getAuth } from './auth/auth.services';
import { setupDatabase } from './database/database';
import { registerEventHandlers } from './events/events.handlers';
import { createEventServices } from './events/events.services';
import { createGracefulShutdownService } from './graceful-shutdown/graceful-shutdown.services';

export function createTestServerDependencies(overrides: Partial<GlobalDependencies> = {}): GlobalDependencies {
  const config = overrides.config ?? overrideConfig();
  const shutdownServices = overrides.shutdownServices ?? createGracefulShutdownService();
  const db = overrides.db ?? setupDatabase({ ...config.database, shutdownServices }).db;

  const documentsStorageService = overrides.documentsStorageService ?? createDocumentStorageService({ documentStorageConfig: config.documentsStorage });
  const taskServices = overrides.taskServices ?? createInMemoryTaskServices();
  const trackingServices = overrides.trackingServices ?? createDummyTrackingServices();
  const eventServices = overrides.eventServices ?? createEventServices();
  const emailsServices = overrides.emailsServices ?? createEmailsServices({ config });
  const authEmailsServices = createAuthEmailsServices({ emailsServices });
  const auth = overrides.auth ?? getAuth({ db, config, authEmailsServices, eventServices }).auth;
  const subscriptionsServices = overrides.subscriptionsServices ?? createSubscriptionsServices({ config });
  const documentSearchServices = overrides.documentSearchServices ?? createDocumentSearchServices({ db, config });

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
