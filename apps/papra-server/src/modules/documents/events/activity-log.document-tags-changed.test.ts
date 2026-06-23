import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createEventServices } from '../../app/events/events.services';
import { nextTick } from '../../shared/async/defer.test-utils';
import { documentActivityLogTable } from '../document-activity/document-activity.table';
import { registerInsertActivityLogOnDocumentTagsChangedHandler } from './activity-log.document-tags-changed';

const baseDocument = {
  organizationId: 'organization-1',
  mimeType: 'text/plain',
  originalStorageKey: 'organization-1/originals/document.txt',
  originalName: 'document.txt',
};

describe('activity-log document-tags-changed', () => {
  describe('registerInsertActivityLogOnDocumentTagsChangedHandler', () => {
    test('writes a tagged/untagged activity log per changed pair in a single bulk insert', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        documents: [
          { id: 'doc-1', ...baseDocument, name: 'doc 1', originalSha256Hash: 'h1' },
          { id: 'doc-2', ...baseDocument, name: 'doc 2', originalSha256Hash: 'h2' },
        ],
        tags: [
          {
            id: 'tag-1',
            name: 'Tag One',
            normalizedName: 'tag one',
            color: '#000',
            organizationId: 'organization-1',
          },
          {
            id: 'tag-2',
            name: 'Tag Two',
            normalizedName: 'tag two',
            color: '#111',
            organizationId: 'organization-1',
          },
        ],
      });

      const eventServices = createEventServices({ logger: createNoopLogger() });
      registerInsertActivityLogOnDocumentTagsChangedHandler({ eventServices, db });

      eventServices.emitEvent({
        eventName: 'document.tags.changed',
        payload: {
          organizationId: 'organization-1',
          userId: 'user-1',
          addedPairs: [
            { documentId: 'doc-1', tagId: 'tag-1', tagName: 'Tag One' },
            { documentId: 'doc-2', tagId: 'tag-1', tagName: 'Tag One' },
          ],
          removedPairs: [{ documentId: 'doc-1', tagId: 'tag-2', tagName: 'Tag Two' }],
        },
      });

      await nextTick();

      const rows = await db.select().from(documentActivityLogTable);
      const events = rows.map((r) => `${r.documentId}:${r.event}:${r.tagId}`).toSorted();

      expect(events).to.eql(['doc-1:tagged:tag-1', 'doc-1:untagged:tag-2', 'doc-2:tagged:tag-1']);
      expect(rows.every((r) => r.userId === 'user-1')).to.eql(true);
    });
  });
});
