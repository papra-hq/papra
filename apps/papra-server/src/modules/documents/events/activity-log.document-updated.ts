import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentUpdatedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'insert-activity-log',
    async handler({ document, changes, userId }) {
      await registerDocumentActivityLog({
        documentId: document.id,
        event: 'updated',
        userId,
        documentActivityRepository,
        eventData: {
          updatedFields: Object.keys(changes).filter(key => changes[key as keyof typeof changes] !== undefined),
        },
      });
    },
  });
}
