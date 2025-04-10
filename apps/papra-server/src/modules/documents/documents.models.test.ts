import { describe, expect, test } from 'vitest';
import { buildOriginalDocumentKey, isDocumentSizeLimitEnabled, joinStorageKeyParts } from './documents.models';

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
    test('the user can disable the document size limit by setting the maxUploadSize to 0', () => {
      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 0 })).to.eql(false);

      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 100 })).to.eql(true);
      expect(isDocumentSizeLimitEnabled({ maxUploadSize: 42 })).to.eql(true);
    });
  });
});
