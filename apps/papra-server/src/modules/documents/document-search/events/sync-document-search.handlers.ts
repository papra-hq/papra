import type { EventServices } from '../../../app/events/events.services';
import type { DocumentSearchServices } from '../document-search.types';

/**
 * Wires up document events to the search service to asynchronously synchronize the service with document changes.
 */
export function registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices }: {
  eventServices: EventServices;
  documentSearchServices: DocumentSearchServices;
}) {
  eventServices.onEvent({
    eventName: 'document.created',
    handlerName: 'index-document-in-search-service',
    async handler({ document }) {
      await documentSearchServices.indexDocument({ document });
    },
  });

  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'update-document-in-search-service',
    async handler({ document, changes }) {
      await documentSearchServices.updateDocument({ document: changes, documentId: document.id });
    },
  });

  eventServices.onEvent({
    eventName: 'document.trashed',
    handlerName: 'mark-document-deleted-in-search-service',
    async handler({ documentId }) {
      await documentSearchServices.updateDocument({ documentId, document: { isDeleted: true } });
    },
  });

  eventServices.onEvent({
    eventName: 'document.restored',
    handlerName: 'restore-document-in-search-service',
    async handler({ documentId }) {
      await documentSearchServices.updateDocument({ documentId, document: { isDeleted: false } });
    },
  });

  eventServices.onEvent({
    eventName: 'document.deleted',
    handlerName: 'remove-document-from-search-service',
    async handler({ documentId }) {
      await documentSearchServices.deleteDocument({ documentId });
    },
  });
}
