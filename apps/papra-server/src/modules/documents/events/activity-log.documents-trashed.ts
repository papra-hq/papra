import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentsActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentsTrashedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'documents.trashed',
    handlerName: 'insert-activity-log',
    async handler({ documentIds, trashedBy }) {
      await registerDocumentsActivityLog({
        activities: documentIds.map(documentId => ({
          documentId,
          event: 'deleted',
          userId: trashedBy,
        })),
        documentActivityRepository,
      });
    },
  });
}
