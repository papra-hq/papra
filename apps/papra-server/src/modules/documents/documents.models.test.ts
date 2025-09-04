import { describe, expect, test } from 'vitest';
import { buildOriginalDocumentKey, formatDocumentForApi, isDocumentSizeLimitEnabled, joinStorageKeyParts } from './documents.models';

describe('documents models', () => {
  describe('joinStorageKeyParts', () => {
    test('the parts of a storage key are joined with a slash', () => {
      expect(joinStorageKeyParts('org_1', 'documents', 'file.txt')).to.eql('org_1/documents/file.txt');
    });
  });

  describe('buildOriginalDocumentKey', () => {
    test(`the original document storage key is composed of 
          - the organization id
          - the original documents storage key "originals"
          - the document id withe the same extension as the original file (if any)`, () => {
      expect(buildOriginalDocumentKey({
        documentId: 'doc_1',
        organizationId: 'org_1',
        fileName: 'file.txt',
      })).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1.txt',
      });

      expect(buildOriginalDocumentKey({
        documentId: 'doc_1',
        organizationId: 'org_1',
        fileName: 'file',
      })).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1',
      });

      expect(buildOriginalDocumentKey({
        documentId: 'doc_1',
        organizationId: 'org_1',
        fileName: 'file.',
      })).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1',
      });

      expect(buildOriginalDocumentKey({
        documentId: 'doc_1',
        organizationId: 'org_1',
        fileName: '',
      })).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1',
      });
    });
  });

  describe('isDocumentSizeLimitEnabled', () => {
    test('the user can disable the document size limit by setting the maxUploadSize to 0 or less', () => {
      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 0 })).to.eql(false);
      expect(isDocumentSizeLimitEnabled({ maxUploadSize: -1 })).to.eql(false);

      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 100 })).to.eql(true);
      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 42 })).to.eql(true);
    });
  });

  describe('formatDocumentForApi', () => {
    test('formats a document from the database into a user facing document by omitting the storage key and encryption related fields', () => {
      expect(formatDocumentForApi({
        document: {
          id: 'doc_1',
          organizationId: 'org_1',
          createdBy: 'user_1',
          deletedAt: null,
          deletedBy: null,
          name: 'file.txt',
          mimeType: 'text/plain',
          originalName: 'file.txt',
          originalSize: 100,
          originalStorageKey: 'org_1/originals/doc_1.txt',
          originalSha256Hash: '1234567890',
          fileEncryptionAlgorithm: 'aes-256-gcm',
          fileEncryptionKeyWrapped: '1234567890',
          fileEncryptionKekVersion: '1.0',
          content: 'Hello, world!',
          isDeleted: false,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      })).to.eql({
        content: 'Hello, world!',
        createdAt: new Date('2025-01-01'),
        createdBy: 'user_1',
        deletedAt: null,
        deletedBy: null,
        id: 'doc_1',
        isDeleted: false,
        mimeType: 'text/plain',
        name: 'file.txt',
        organizationId: 'org_1',
        originalName: 'file.txt',
        originalSha256Hash: '1234567890',
        originalSize: 100,
        updatedAt: new Date('2025-01-01'),
      });
    });
  });
});
