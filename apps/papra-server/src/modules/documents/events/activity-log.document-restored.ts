import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentRestoredHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'document.restored',
    handlerName: 'insert-activity-log',
    async handler({ documentId, restoredBy }) {
      await registerDocumentActivityLog({
        documentId,
        event: 'restored',
        userId: restoredBy,
        documentActivityRepository,
      });
    },
  });
}
