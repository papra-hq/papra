import type { Database } from '../../app/database/database.types';
import type { EventServices } from '../../app/events/events.services';
import { createDocumentActivityRepository } from '../document-activity/document-activity.repository';
import { registerDocumentsActivityLog } from '../document-activity/document-activity.usecases';

export function registerInsertActivityLogOnDocumentTagsChangedHandler({
  eventServices,
  db,
}: {
  eventServices: EventServices;
  db: Database;
}) {
  const documentActivityRepository = createDocumentActivityRepository({ db });

  eventServices.onEvent({
    eventName: 'document.tags.changed',
    handlerName: 'insert-activity-log',
    async handler({ userId, addedPairs, removedPairs }) {
      await registerDocumentsActivityLog({
        activities: [
          ...addedPairs.map(({ documentId, tagId }) => ({
            documentId,
            event: 'tagged' as const,
            userId,
            tagId,
          })),
          ...removedPairs.map(({ documentId, tagId }) => ({
            documentId,
            event: 'untagged' as const,
            userId,
            tagId,
          })),
        ],
        documentActivityRepository,
      });
    },
  });
}
