import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestEventServices } from '../app/events/events.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable, tagsTable } from '../tags/tags.table';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import { buildApplyAutoTaggingActions } from './auto-tagging.usecases';

async function createTestDeps(
  seedOptions: Parameters<typeof createInMemoryDatabase>[0],
  config = overrideConfig(),
) {
  const { db } = await createInMemoryDatabase(seedOptions);
  const tagsRepository = createTagsRepository({ db });
  const eventServices = createTestEventServices();
  const { logger } = createTestLogger();

  return {
    db,
    tagsRepository,
    eventServices,
    logger,
    applyAutoTaggingActions: buildApplyAutoTaggingActions({
      createTag: async (args) => createTag({ ...args, config, tagsRepository }),
      applyTagsToDocuments: async (args) =>
        applyTagsToDocuments({ ...args, tagsRepository, eventServices, logger }),
    }),
  };
}

const baseDocument = {
  id: 'doc_1',
  organizationId: 'org_1',
  name: 'Doc 1',
  originalName: 'Doc 1',
  originalStorageKey: 'doc_1',
  originalSha256Hash: 'doc_1',
  mimeType: 'text/plain',
  content: 'Some document content',
};

const financeTag = {
  id: 'tag_1',
  name: 'Finance',
  normalizedName: 'finance',
  color: '#000000',
  organizationId: 'org_1',
};

const householdTag = {
  id: 'tag_2',
  name: 'Household',
  normalizedName: 'household',
  color: '#000000',
  organizationId: 'org_1',
};

const documentIds = { documentId: 'doc_1', organizationId: 'org_1' };

const seed = {
  organizations: [{ id: 'org_1', name: 'Org 1' }],
  documents: [baseDocument],
  tags: [financeTag, householdTag],
};

describe('auto-tagging usecases', () => {
  describe('buildApplyAutoTaggingActions', () => {
    test('existing and successfully created tags are applied despite a creation failure, preserving current tags and emitting the domain event', async () => {
      const deps = await createTestDeps(seed);
      await deps.db.insert(documentsTagsTable).values({ documentId: 'doc_1', tagId: 'tag_2' });

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ['tag_1'],
        tagsToCreate: [
          { name: 'Finance' },
          { name: 'Invoice', description: 'Invoices and receipts' },
        ],
      });

      const tags = await deps.db.select().from(tagsTable);
      expect(tags.length).toEqual(3);
      const invoiceTag = tags.find((tag) => tag.name === 'Invoice')!;
      expect(invoiceTag).toMatchObject({
        description: 'Invoices and receipts',
        color: '#CCCCCC',
        organizationId: 'org_1',
      });
      const documentTags = await deps.db.select().from(documentsTagsTable);
      expect(documentTags.map(({ tagId }) => tagId).sort()).toEqual(
        ['tag_1', 'tag_2', invoiceTag.id].sort(),
      );
      expect(deps.eventServices.getEmittedEvents()).toEqual([
        {
          eventName: 'document.tags.changed',
          payload: {
            organizationId: 'org_1',
            userId: undefined,
            addedPairs: [
              { documentId: 'doc_1', tagId: 'tag_1', tagName: 'Finance' },
              { documentId: 'doc_1', tagId: invoiceTag.id, tagName: 'Invoice' },
            ],
            removedPairs: [],
          },
        },
      ]);
    });

    test('the organization tag limit prevents new tags without preventing existing tags from being applied', async () => {
      const deps = await createTestDeps(
        seed,
        overrideConfig({ tags: { maxTagsPerOrganization: 2 } }),
      );

      await deps.applyAutoTaggingActions({
        ...documentIds,
        tagIdsToAdd: ['tag_1'],
        tagsToCreate: [{ name: 'Invoice' }],
      });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: 'tag_1' },
      ]);
    });

    test('empty actions leave existing tags untouched and emit no event', async () => {
      const deps = await createTestDeps(seed);
      await deps.db.insert(documentsTagsTable).values({ documentId: 'doc_1', tagId: 'tag_2' });

      await deps.applyAutoTaggingActions({ ...documentIds, tagIdsToAdd: [], tagsToCreate: [] });

      expect((await deps.db.select().from(tagsTable)).length).toEqual(2);
      expect(await deps.db.select().from(documentsTagsTable)).toEqual([
        { documentId: 'doc_1', tagId: 'tag_2' },
      ]);
      expect(deps.eventServices.getEmittedEvents()).toEqual([]);
    });
  });
});
