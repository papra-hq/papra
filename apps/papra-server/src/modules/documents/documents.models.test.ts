import { describe, expect, test } from 'vitest';
import {
  buildOriginalDocumentKey,
  ensureSafeFileName,
  formatDocumentForApi,
  isDocumentSizeLimitEnabled,
  joinStorageKeyParts,
} from './documents.models';

describe('documents models', () => {
  describe('joinStorageKeyParts', () => {
    test('the parts of a storage key are joined with a slash', () => {
      expect(joinStorageKeyParts('org_1', 'documents', 'file.txt')).to.eql(
        'org_1/documents/file.txt',
      );
    });
  });

  describe('buildOriginalDocumentKey', () => {
    test(`the original document storage key is composed of
          - the organization id
          - the original documents storage key "originals"
          - the document id withe the same extension as the original file (if any)`, () => {
      expect(
        buildOriginalDocumentKey({
          documentId: 'doc_1',
          organizationId: 'org_1',
          fileName: 'file.txt',
        }),
      ).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1.txt',
      });

      expect(
        buildOriginalDocumentKey({
          documentId: 'doc_1',
          organizationId: 'org_1',
          fileName: 'file',
        }),
      ).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1',
      });

      expect(
        buildOriginalDocumentKey({
          documentId: 'doc_1',
          organizationId: 'org_1',
          fileName: 'file.',
        }),
      ).to.eql({
        originalDocumentStorageKey: 'org_1/originals/doc_1',
      });

      expect(
        buildOriginalDocumentKey({
          documentId: 'doc_1',
          organizationId: 'org_1',
          fileName: '',
        }),
      ).to.eql({
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
      expect(
        formatDocumentForApi({
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
            documentDate: new Date('2025-12-24'),
            notes: null,
          },
        }),
      ).to.eql({
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
        documentDate: new Date('2025-12-24'),
        notes: null,
      });
    });
  });

  describe('ensureSafeFileName', () => {
    test('replaces characters that are not allowed in file names with an underscore', () => {
      expect(ensureSafeFileName('file.txt')).to.eql('file.txt');
      expect(ensureSafeFileName('fi/le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi\\le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi:le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi*le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi?le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi"le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi<le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi>le.txt')).to.eql('fi_le.txt');
      expect(ensureSafeFileName('fi|le.txt')).to.eql('fi_le.txt');
    });

    test('leading spaces are preserved as they are valid in file names, but trailing spaces are removed', () => {
      expect(ensureSafeFileName(' file.txt')).to.eql(' file.txt');
      expect(ensureSafeFileName('file.txt ')).to.eql('file.txt');
      expect(ensureSafeFileName(' file.txt ')).to.eql(' file.txt');
    });

    test('leading dots are preserved as they are valid in file names, but trailing dots are removed', () => {
      expect(ensureSafeFileName('.file.txt')).to.eql('.file.txt');
      expect(ensureSafeFileName('..file.txt')).to.eql('..file.txt');
      expect(ensureSafeFileName('file.txt.')).to.eql('file.txt');
      expect(ensureSafeFileName('.file.txt.')).to.eql('.file.txt');
    });

    test('reserved file names on Windows get an underscore before any extension', () => {
      const reservedFileNames = [
        'con',
        'prn',
        'aux',
        'nul',
        ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
        ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
      ];

      for (const reservedFileName of reservedFileNames) {
        const lower = reservedFileName;
        const upper = reservedFileName.toUpperCase();
        const title = upper[0] + lower.slice(1);

        expect(ensureSafeFileName(lower)).to.eql(`${lower}_`);
        expect(ensureSafeFileName(upper)).to.eql(`${upper}_`);
        expect(ensureSafeFileName(title)).to.eql(`${title}_`);

        // Windows reserves these names even when followed by one or more extensions.
        for (const extension of ['.txt', '.tar.gz']) {
          expect(ensureSafeFileName(`${lower}${extension}`)).to.eql(`${lower}_${extension}`);
          expect(ensureSafeFileName(`${upper}${extension}`)).to.eql(`${upper}_${extension}`);
          expect(ensureSafeFileName(`${title}${extension}`)).to.eql(`${title}_${extension}`);
        }
      }
    });

    test('file names that only start with a Windows reserved name are preserved', () => {
      expect(ensureSafeFileName('console.txt')).to.eql('console.txt');
      expect(ensureSafeFileName('auxiliary.txt')).to.eql('auxiliary.txt');
      expect(ensureSafeFileName('com10.txt')).to.eql('com10.txt');
      expect(ensureSafeFileName('lpt10.txt')).to.eql('lpt10.txt');
    });

    test('path separators are replaced with underscores to prevent directory traversal', () => {
      expect(ensureSafeFileName('../file.txt')).to.eql('_file.txt');
      expect(ensureSafeFileName('..\\file.txt')).to.eql('_file.txt');
      expect(ensureSafeFileName('..//file.txt')).to.eql('_file.txt');
      expect(ensureSafeFileName('..\\\\file.txt')).to.eql('_file.txt');
      expect(ensureSafeFileName('/foo/bar/file.txt')).to.eql('_foo_bar_file.txt');
    });

    test('edge cases', () => {
      expect(ensureSafeFileName('')).to.eql('_');
      expect(ensureSafeFileName('../')).to.eql('_');
      expect(ensureSafeFileName('../..')).to.eql('_');
      expect(ensureSafeFileName('   ')).to.eql('_');
      expect(ensureSafeFileName('...')).to.eql('_');
    });
  });
});
