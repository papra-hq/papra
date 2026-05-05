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
    getDocumentIdsMatchingQuery: [] as Parameters<DocumentSearchServices['getDocumentIdsMatchingQuery']>[0][],
    indexDocuments: [] as Parameters<DocumentSearchServices['indexDocuments']>[0][],
    updateDocuments: [] as Parameters<DocumentSearchServices['updateDocuments']>[0][],
    deleteDocuments: [] as Parameters<DocumentSearchServices['deleteDocuments']>[0][],
  };

  const searchServices: DocumentSearchServices = {
    name: 'test-search-service',
    searchDocuments: async (args) => {
      methodsArgs.searchDocuments.push(args);
      return { documents: [], documentsCount: 0 };
    },
    getDocumentIdsMatchingQuery: async (args) => {
      methodsArgs.getDocumentIdsMatchingQuery.push(args);
      return { documentIds: [] };
    },
    indexDocuments: async (args) => {
      methodsArgs.indexDocuments.push(args);
    },
    updateDocuments: async (args) => {
      methodsArgs.updateDocuments.push(args);
    },
    deleteDocuments: async (args) => {
      methodsArgs.deleteDocuments.push(args);
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
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        documentDate: new Date('2025-12-24'),
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
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [{ documents: [document] }],
        updateDocuments: [],
        deleteDocuments: [],
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
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        documentDate: new Date('2025-12-24'),
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
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [],
        updateDocuments: [{
          updates: [{
            documentId: 'doc-1',
            document: changes,
          }],
        }],
        deleteDocuments: [],
      });
    });

    test('when documents.trashed event fires, the documents are marked as deleted in the search service', async () => {
      const eventServices = createEventServices({ logger: createNoopLogger() });

      const documentSearchServices = createTestSearchServices();

      registerSyncDocumentSearchEventHandlers({ eventServices, documentSearchServices });

      eventServices.emitEvent({
        eventName: 'documents.trashed',
        payload: {
          documentIds: ['doc-1'],
          organizationId: 'organization-1',
          trashedBy: 'user-1',
        },
      });

      await nextTick();

      expect(documentSearchServices.getMethodsArguments()).to.eql({
        searchDocuments: [],
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [],
        updateDocuments: [{
          updates: [{
            documentId: 'doc-1',
            document: { isDeleted: true },
          }],
        }],
        deleteDocuments: [],
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
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [],
        updateDocuments: [{
          updates: [{
            documentId: 'doc-1',
            document: { isDeleted: false },
          }],
        }],
        deleteDocuments: [],
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
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [],
        updateDocuments: [],
        deleteDocuments: [{ documentIds: ['doc-1'] }],
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
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        documentDate: new Date('2025-12-24'),
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
        eventName: 'documents.trashed',
        payload: {
          documentIds: ['doc-1'],
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
        getDocumentIdsMatchingQuery: [],
        indexDocuments: [{ documents: [document] }],
        updateDocuments: [
          {
            updates: [{
              documentId: 'doc-1',
              document: { name: 'Updated Name' },
            }],
          },
          {
            updates: [{
              documentId: 'doc-1',
              document: { isDeleted: true },
            }],
          },
          {
            updates: [{
              documentId: 'doc-1',
              document: { isDeleted: false },
            }],
          },
        ],
        deleteDocuments: [{ documentIds: ['doc-1'] }],
      });
    });
  });
});
