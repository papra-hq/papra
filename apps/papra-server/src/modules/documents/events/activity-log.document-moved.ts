import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentMovedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'document.moved',
    handlerName: 'insert-activity-log',
    async handler({ document, userId, sourceOrganizationId, targetOrganizationId }) {
      await registerDocumentActivityLog({
        documentId: document.id,
        event: 'moved',
        eventData: { sourceOrganizationId, targetOrganizationId },
        userId,
        documentActivityRepository,
      });
    },
  });
}
