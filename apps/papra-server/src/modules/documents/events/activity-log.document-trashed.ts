import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentTrashedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'document.trashed',
    handlerName: 'insert-activity-log',
    async handler({ documentId, trashedBy }) {
      await registerDocumentActivityLog({
        documentId,
        event: 'deleted',
        userId: trashedBy,
        documentActivityRepository,
      });
    },
  });
}
