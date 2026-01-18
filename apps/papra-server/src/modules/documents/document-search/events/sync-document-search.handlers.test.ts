import type { Document } from '../../documents.types';
import type { DocumentSearchServices } from '../document-search.types';
import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createEventServices } from '../../../app/events/events.services';
import { nextTick } from '../../../shared/async/defer.test-utils';
import { registerSyncDocumentSearchEventHandlers } from './sync-document-search.handlers';

function createTestSearchServices() {
  const methodsArgs = {
    searchDocuments: [] as Parameters<DocumentSearchServices['searchDocuments']>[0][],
    indexDocument: [] as Parameters<DocumentSearchServices['indexDocument']>[0][],
    updateDocument: [] as Parameters<DocumentSearchServices['updateDocument']>[0][],
    deleteDocument: [] as Parameters<DocumentSearchServices['deleteDocument']>[0][],
  };

  const searchServices: DocumentSearchServices = {
    name: 'test-search-service',
    searchDocuments: async (args) => {
      methodsArgs.searchDocuments.push(args);
      return { documents: [], totalCount: 0 };
    },
    indexDocument: async (args) => {
      methodsArgs.indexDocument.push(args);
    },
    updateDocument: async (args) => {
      methodsArgs.updateDocument.push(args);
    },
    deleteDocument: async (args) => {
      methodsArgs.deleteDocument.push(args);
    },
  };

  return {
    ...searchServices,
    getMethodsArguments: () => methodsArgs,
  };
}

describe('sync-document-search event handlers', () => {
  describe('registerSyncDocumentSearchEventHandlers', () => {
    test('when document.created event fires, the document is indexed in the search service', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      const document: Document = {
        id: 'doc-1',
        organizationId: 'organization-1',
        name: 'Test Document',
        originalName: 'test-document.pdf',
        content: 'searchable content',
        mimeType: 'application/pdf',
        originalStorageKey: 'storage-key',
        originalSha256Hash: 'hash1',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        originalSize: 1024,
        deletedAt: null,
        deletedBy: null,
        fileEncryptionAlgorithm: null,
        fileEncryptionKekVersion: null,
        fileEncryptionKeyWrapped: null,
      };

      eventServices.emitEvent({
        eventName: 'document.created',
        payload: { document },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [{ document }],
        updateDocument: [],
        deleteDocument: [],
      });
    });

    test('when document.updated event fires, the document is updated in the search service with the changes', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      const document: Document = {
        id: 'doc-1',
        organizationId: 'organization-1',
        name: 'Updated Document',
        originalName: 'updated-document.pdf',
        content: 'updated content',
        mimeType: 'application/pdf',
        originalStorageKey: 'storage-key',
        originalSha256Hash: 'hash1',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        originalSize: 1024,
        deletedAt: null,
        deletedBy: null,
        fileEncryptionAlgorithm: null,
        fileEncryptionKekVersion: null,
        fileEncryptionKeyWrapped: null,
      };

      const changes = {
        name: 'Updated Document',
        content: 'updated content',
      };

      eventServices.emitEvent({
        eventName: 'document.updated',
        payload: { document, changes, userId: 'user-1' },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [],
        updateDocument: [{
          documentId: 'doc-1',
          document: changes,
        }],
        deleteDocument: [],
      });
    });

    test('when document.trashed event fires, the document is marked as deleted in the search service', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      eventServices.emitEvent({
        eventName: 'document.trashed',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          trashedBy: 'user-1',
        },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [],
        updateDocument: [{
          documentId: 'doc-1',
          document: { isDeleted: true },
        }],
        deleteDocument: [],
      });
    });

    test('when document.restored event fires, the document is marked as not deleted in the search service', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      eventServices.emitEvent({
        eventName: 'document.restored',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          restoredBy: 'user-1',
        },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [],
        updateDocument: [{
          documentId: 'doc-1',
          document: { isDeleted: false },
        }],
        deleteDocument: [],
      });
    });

    test('when document.deleted event fires, the document is removed from the search service', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      eventServices.emitEvent({
        eventName: 'document.deleted',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
        },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [],
        updateDocument: [],
        deleteDocument: [{ documentId: 'doc-1' }],
      });
    });

    test('multiple events are handled independently and in sequence', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      const document: Document = {
        id: 'doc-1',
        organizationId: 'organization-1',
        name: 'Test Document',
        originalName: 'test-document.pdf',
        content: 'searchable content',
        mimeType: 'application/pdf',
        originalStorageKey: 'storage-key',
        originalSha256Hash: 'hash1',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        originalSize: 1024,
        deletedAt: null,
        deletedBy: null,
        fileEncryptionAlgorithm: null,
        fileEncryptionKekVersion: null,
        fileEncryptionKeyWrapped: null,
      };

      // Emit multiple events in sequence
      eventServices.emitEvent({
        eventName: 'document.created',
        payload: { document },
      });

      eventServices.emitEvent({
        eventName: 'document.updated',
        payload: {
          document,
          changes: { name: 'Updated Name' },
          userId: 'user-1',
        },
      });

      eventServices.emitEvent({
        eventName: 'document.trashed',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          trashedBy: 'user-1',
        },
      });

      eventServices.emitEvent({
        eventName: 'document.restored',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
          restoredBy: 'user-1',
        },
      });

      eventServices.emitEvent({
        eventName: 'document.deleted',
        payload: {
          documentId: 'doc-1',
          organizationId: 'organization-1',
        },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        indexDocument: [{ document }],
        updateDocument: [
          {
            documentId: 'doc-1',
            document: { name: 'Updated Name' },
          },
          {
            documentId: 'doc-1',
            document: { isDeleted: true },
          },
          {
            documentId: 'doc-1',
            document: { isDeleted: false },
          },
        ],
        deleteDocument: [{ documentId: 'doc-1' }],
      });
    });
  });
});
