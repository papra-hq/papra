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
      await documentSearchServices.indexDocuments({ documents: [document] });
    },
  });

  eventServices.onEvent({
    eventName: 'document.updated',
    handlerName: 'update-document-in-search-service',
    async handler({ document, changes }) {
      await documentSearchServices.updateDocuments({ updates: [{ documentId: document.id, document: changes }] });
    },
  });

  eventServices.onEvent({
    eventName: 'documents.trashed',
    handlerName: 'mark-documents-deleted-in-search-service',
    async handler({ documentIds }) {
      await documentSearchServices.updateDocuments({ updates: documentIds.map(documentId => ({ documentId, document: { isDeleted: true } })) });
    },
  });

  eventServices.onEvent({
    eventName: 'document.restored',
    handlerName: 'restore-document-in-search-service',
    async handler({ documentId }) {
      await documentSearchServices.updateDocuments({ updates: [{ documentId, document: { isDeleted: false } }] });
    },
  });

  eventServices.onEvent({
    eventName: 'document.deleted',
    handlerName: 'remove-document-from-search-service',
    async handler({ documentId }) {
      await documentSearchServices.deleteDocuments({ documentIds: [documentId] });
    },
  });
}
