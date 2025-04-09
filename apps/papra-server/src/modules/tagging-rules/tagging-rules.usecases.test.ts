import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { documentsTable } from '../documents/documents.table';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable } from '../tags/tags.table';
import { createTaggingRulesRepository } from './tagging-rules.repository';
import { applyTaggingRules } from './tagging-rules.usecases';

describe('tagging-rules usecases', () => {
  describe('applyTaggingRules', () => {
    test('when a document matches a tagging rule, the tag is applied to the document', async () => {
      const { logger, getLogs } = createTestLogger();

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1' }],
        taggingRuleConditions: [{ id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'equal', value: 'Doc 1' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, logger });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          data: {
            tagIdsToApply: ['tag_1'],
            appliedTagIds: ['tag_1'],
            taggingRulesIdsToApply: ['tr_1'],
            hasAllTagBeenApplied: true,
          },
          level: 'info',
          message: 'Tagging rules applied',
          namespace: 'test',
        },
      ]);
    });

    test('a rule without conditions will apply its tags to all imported documents', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);
    });

    test('an organization with no tagging rules will not apply any tag to a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([]);
    });
  });
});
