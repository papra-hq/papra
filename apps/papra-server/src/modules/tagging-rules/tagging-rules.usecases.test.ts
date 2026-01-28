import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createDocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentsTable } from '../documents/documents.table';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { isNil } from '../shared/utils';
import { createTagsRepository } from '../tags/tags.repository';
import { documentsTagsTable } from '../tags/tags.table';
import { createWebhookRepository } from '../webhooks/webhook.repository';
import { createTaggingRulesRepository } from './tagging-rules.repository';
import { applyTaggingRules, applyTaggingRuleToExistingDocuments } from './tagging-rules.usecases';

describe('tagging-rules usecases', () => {
  describe('applyTaggingRules', () => {
    test('when a document matches a tagging rule, the tag is applied to the document', async () => {
      const { logger, getLogs } = createTestLogger();

      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1' }],
        taggingRuleConditions: [{ id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'equal', value: 'Doc 1' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        // type safety
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository, logger });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          data: {
            taggingRuleId: 'tr_1',
            appliedTagIds: ['tag_1'],
            expectedTagCount: 1,
            hasAllTagBeenApplied: true,
          },
          level: 'info',
          message: 'Tagging rule applied to document',
          namespace: 'test',
        },
        {
          data: {
            taggingRulesCount: 1,
            appliedTagIds: ['tag_1'],
          },
          level: 'info',
          message: 'All tagging rules applied to document',
          namespace: 'test',
        },
      ]);
    });

    test('a rule without conditions will apply its tags to all imported documents', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        // type safety
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);
    });

    test('a rule without conditions and conditionMatchMode "any" applies tags to all documents', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1', conditionMatchMode: 'any' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      // Should still apply the tag even with conditionMatchMode 'any' and no conditions
      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);
    });

    test('an organization with no tagging rules will not apply any tag to a document', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        // type safety
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      expect(documentTags).to.eql([]);
    });

    test('when conditionMatchMode is "any", tags are applied when at least one condition matches', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Invoice 2024', originalName: 'Invoice 2024', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1', conditionMatchMode: 'any' }],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Invoice' },
          { id: 'trc_2', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Receipt' },
        ],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      // Tag should be applied because one condition (Invoice) matches
      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);
    });

    test('when conditionMatchMode is "any", tags are not applied when no conditions match', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Contract 2024', originalName: 'Contract 2024', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1', conditionMatchMode: 'any' }],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Invoice' },
          { id: 'trc_2', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Receipt' },
        ],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      // Tag should not be applied because no conditions match
      expect(documentTags).to.eql([]);
    });

    test('when conditionMatchMode is "all" (default), tags are applied only when all conditions match', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Invoice 2024', originalName: 'Invoice 2024', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1', conditionMatchMode: 'all' }],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Invoice' },
          { id: 'trc_2', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: '2024' },
        ],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      // Tag should be applied because all conditions match
      expect(documentTags).to.eql([{ documentId: 'doc_1', tagId: 'tag_1' }]);
    });

    test('when conditionMatchMode is "all" (default), tags are not applied when only some conditions match', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        documents: [{ id: 'doc_1', organizationId: 'org_1', name: 'Invoice 2024', originalName: 'Invoice 2024', originalStorageKey: 'doc_1', originalSha256Hash: 'doc_1', mimeType: 'text/plain' }],

        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tagging Rule 1', conditionMatchMode: 'all' }],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Invoice' },
          { id: 'trc_2', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Receipt' },
        ],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, 'doc_1'));

      if (isNil(document)) {
        throw new Error('Document not found');
      }

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await applyTaggingRules({ document, taggingRulesRepository, tagsRepository, webhookRepository, documentActivityRepository });

      const documentTags = await db.select().from(documentsTagsTable);

      // Tag should not be applied because only one condition matches (Invoice, not Receipt)
      expect(documentTags).to.eql([]);
    });
  });

  describe('applyTaggingRuleToExistingDocuments', () => {
    test('applying rule to existing documents tags only matching ones', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Invoice', normalizedName: 'invoice', color: '#000000', organizationId: 'org_1' }],
        documents: [
          { id: 'doc_1', organizationId: 'org_1', name: 'Invoice 2024', originalName: 'Invoice 2024', originalStorageKey: 'doc_1', originalSha256Hash: 'hash_1', mimeType: 'text/plain' },
          { id: 'doc_2', organizationId: 'org_1', name: 'Invoice Q1', originalName: 'Invoice Q1', originalStorageKey: 'doc_2', originalSha256Hash: 'hash_2', mimeType: 'text/plain' },
          { id: 'doc_3', organizationId: 'org_1', name: 'Contract', originalName: 'Contract', originalStorageKey: 'doc_3', originalSha256Hash: 'hash_3', mimeType: 'text/plain' },
        ],
        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Tag Invoices', enabled: true }],
        taggingRuleConditions: [{ id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'contains', value: 'Invoice' }],
        taggingRuleActions: [{ id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' }],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      const result = await applyTaggingRuleToExistingDocuments({
        taggingRuleId: 'tr_1',
        organizationId: 'org_1',
        taggingRulesRepository,
        documentsRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
      });

      expect(result.processedCount).toBe(3);
      expect(result.taggedDocumentsCount).toBe(2); // All documents are processed (applyTaggingRules is called for each)

      const documentTags = await db.select().from(documentsTagsTable);

      // Only doc_1 and doc_2 should be tagged (they contain "Invoice")
      expect(documentTags).toHaveLength(2);
      expect(documentTags.map(dt => dt.documentId).sort()).toEqual(['doc_1', 'doc_2']);
      expect(documentTags.every(dt => dt.tagId === 'tag_1')).toBe(true);
    });

    test('returns error when tagging rule does not exist', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await expect(
        applyTaggingRuleToExistingDocuments({
          taggingRuleId: 'non_existent',
          organizationId: 'org_1',
          taggingRulesRepository,
          documentsRepository,
          tagsRepository,
          webhookRepository,
          documentActivityRepository,
        }),
      ).rejects.toThrow('Tagging rule not found');
    });

    test('processes all documents even when the tagging rule is disabled', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        documents: [
          { id: 'doc_1', organizationId: 'org_1', name: 'Doc 1', originalName: 'Doc 1', originalStorageKey: 'doc_1', originalSha256Hash: 'hash_1', mimeType: 'text/plain' },
        ],
        taggingRules: [{ id: 'tr_1', organizationId: 'org_1', name: 'Rule 1', enabled: false }],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const tagsRepository = createTagsRepository({ db });
      const webhookRepository = createWebhookRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      const result = await applyTaggingRuleToExistingDocuments({
        taggingRuleId: 'tr_1',
        organizationId: 'org_1',
        taggingRulesRepository,
        documentsRepository,
        tagsRepository,
        webhookRepository,
        documentActivityRepository,
      });

      expect(result.processedCount).toBe(1);
      expect(result.taggedDocumentsCount).toBe(0); // No documents tagged because rule is disabled

      const documentTags = await db.select().from(documentsTagsTable);
      expect(documentTags).toHaveLength(0); // No tags applied because rule is disabled
    });
  });
});
