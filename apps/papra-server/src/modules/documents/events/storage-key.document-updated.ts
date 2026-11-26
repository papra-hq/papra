import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import type { Config } from '../../config/config.types';
import type { StorageService } from '../../storage/storage.services';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { buildSyncDocumentStorageKey } from '../document-storage.usecases';
import { createDocumentsRepository } from '../documents.repository';
import { buildResolveStoragePatternContext } from '../storage-patterns/storage-pattern.usecases';

export function registerSyncDocumentStorageKeyHandler({
  eventServices,
  documentsStorageService,
  config,
  db,
}: {
  eventServices: EventServices;
  documentsStorageService: StorageService;
  config: Config;
  db: Database;
}) {
  const syncDocumentStorageKey = buildSyncDocumentStorageKey({
    storagePatternConfig: config.documentsStorage.pattern,
    documentsRepository: createDocumentsRepository({ db }),
    documentsStorageService,
    resolveStoragePatternContext: buildResolveStoragePatternContext({
      organizationsRepository: createOrganizationsRepository({ db }),
    }),
  });

  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'sync-document-storage-key',
    handler: async ({ document, changes }) => {
      if (changes.name === undefined && changes.documentDate === undefined) {
        return;
      }

      await syncDocumentStorageKey({
        documentId: document.id,
        organizationId: document.organizationId,
      });
    },
  });
}
