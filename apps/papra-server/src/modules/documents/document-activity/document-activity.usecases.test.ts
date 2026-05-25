import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createDocumentActivityRepository } from './document-activity.repository';
import { documentActivityLogTable } from './document-activity.table';
import { registerDocumentActivityLog, registerDocumentsActivityLog } from './document-activity.usecases';

describe('document-activity usecases', () => {
  describe('registerDocumentActivityLog', () => {
    test('inserts a single activity log entry for the given document', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org-1', name: 'Org 1' }],
        documents: [{ id: 'doc-1', organizationId: 'org-1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc-1', originalSha256Hash: 'doc-1', mimeType: 'text/plain' }],
      });

      const documentActivityRepository = createDocumentActivityRepository({ db });

      await registerDocumentActivityLog({
        documentId: 'doc-1',
        event: 'updated',
        userId: 'user-1',
        eventData: { updatedFields: ['name'] },
        documentActivityRepository,
        logger: createNoopLogger(),
      });

      const rows = await db.select().from(documentActivityLogTable);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        documentId: 'doc-1',
        event: 'updated',
        userId: 'user-1',
        eventData: { updatedFields: ['name'] },
      });
    });
  });

  describe('registerDocumentsActivityLog', () => {
    test('inserts one activity log entry per input in a single bulk insert', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org-1', name: 'Org 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'org-1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc-1', originalSha256Hash: 'doc-1', mimeType: 'text/plain' },
          { id: 'doc-2', organizationId: 'org-1', name: 'Doc 2', originalName: 'Doc 2', originalStorageKey: 'doc-2', originalSha256Hash: 'doc-2', mimeType: 'text/plain' },
          { id: 'doc-3', organizationId: 'org-1', name: 'Doc 3', originalName: 'Doc 3', originalStorageKey: 'doc-3', originalSha256Hash: 'doc-3', mimeType: 'text/plain' },
        ],
      });

      const documentActivityRepository = createDocumentActivityRepository({ db });

      await registerDocumentsActivityLog({
        activities: [
          { documentId: 'doc-1', event: 'deleted', userId: 'user-1' },
          { documentId: 'doc-2', event: 'deleted', userId: 'user-1' },
          { documentId: 'doc-3', event: 'deleted', userId: 'user-1' },
        ],
        documentActivityRepository,
        logger: createNoopLogger(),
      });

      const rows = await db.select().from(documentActivityLogTable);

      expect(rows).toHaveLength(3);
      expect(rows.map(row => row.documentId).sort()).toEqual(['doc-1', 'doc-2', 'doc-3']);
      expect(rows.every(row => row.event === 'deleted' && row.userId === 'user-1')).toBe(true);
    });

    test('preserves per-entry differences in event, userId, and eventData', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'org-1', name: 'Org 1' }],
        documents: [
          { id: 'doc-1', organizationId: 'org-1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc-1', originalSha256Hash: 'doc-1', mimeType: 'text/plain' },
          { id: 'doc-2', organizationId: 'org-1', name: 'Doc 2', originalName: 'Doc 2', originalStorageKey: 'doc-2', originalSha256Hash: 'doc-2', mimeType: 'text/plain' },
        ],
      });

      const documentActivityRepository = createDocumentActivityRepository({ db });

      await registerDocumentsActivityLog({
        activities: [
          { documentId: 'doc-1', event: 'updated', userId: 'user-1', eventData: { updatedFields: ['name'] } },
          { documentId: 'doc-2', event: 'restored', userId: 'user-2' },
        ],
        documentActivityRepository,
        logger: createNoopLogger(),
      });

      const rows = await db.select().from(documentActivityLogTable).orderBy(documentActivityLogTable.documentId);

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        documentId: 'doc-1',
        event: 'updated',
        userId: 'user-1',
        eventData: { updatedFields: ['name'] },
      });
      expect(rows[1]).toMatchObject({
        documentId: 'doc-2',
        event: 'restored',
        userId: 'user-2',
        eventData: null,
      });
    });

    test('is a no-op when the activities array is empty', async () => {
      const { db } = await createInMemoryDatabase();
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await registerDocumentsActivityLog({
        activities: [],
        documentActivityRepository,
        logger: createNoopLogger(),
      });

      const rows = await db.select().from(documentActivityLogTable);
      expect(rows).toHaveLength(0);
    });
  });
});
