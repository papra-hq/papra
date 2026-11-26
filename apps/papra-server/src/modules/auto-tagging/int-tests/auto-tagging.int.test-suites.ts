import { expect, test, vi } from 'vitest';
import type { Config } from '../../config/config.types';
import { createAiServices } from '../../ai/ai.services';
import type { buildApplyAutoTaggingActions } from '../auto-tagging.usecases';
import { buildEnrichDocument } from '../../document-enrichment/document-enrichment.usecases';
import { buildTagsEnrichmentCapability } from '../../document-enrichment/enrichment-capabilities/tags/tags.enrichment-capability';
import { createDocumentsRepository } from '../../documents/documents.repository';
import { createTagsRepository } from '../../tags/tags.repository';
import { createTestLogger } from '../../shared/logger/logger.test-utils';
import type { Logger } from '@crowlog/logger';
import { createAiCreditsRepository } from '../../ai-credits/ai-credits.repository';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createPlanEntitlementsRepository } from '../../plan-entitlements/plan-entitlements.repository';
import { createPlansRepository } from '../../plans/plans.repository';
import { createSubscriptionsRepository } from '../../subscriptions/subscriptions.repository';
import { createPlanEntitlementDefinitionRegistry } from '../../plan-entitlements/plan-entitlements.registry';

const document = {
  name: 'acme-invoice-2026-06.pdf',
  content: [
    'INVOICE #2026-042',
    'From: Acme Corp, 123 Main St',
    'To: John Doe',
    'Web hosting services, June 2026',
    'Total due: $1,250.00 - payment within 30 days',
  ].join('\n'),
  organizationId: 'org_1',
};

const existingTags = [
  { id: 'tag_1', name: 'invoice', description: 'Bills and invoices' },
  { id: 'tag_2', name: 'recipe', description: 'Cooking recipes' },
  { id: 'tag_3', name: 'contract', description: null },
  { id: 'tag_4', name: 'garden', description: 'Gardening and landscaping' },
];

export async function runAutoTaggingTestSuite({
  modelId,
  config: providerConfig,
  timeout = 20_000,
}: {
  modelId: string;
  config: Config;
  timeout?: number;
}) {
  const config = {
    ...providerConfig,
    ai: { ...providerConfig.ai, isEnabled: true },
  };
  const { db } = await createInMemoryDatabase({
    organizations: [{ id: document.organizationId, name: 'Test organization' }],
    documents: [
      {
        ...document,
        id: 'doc_1',
        originalName: document.name,
        originalStorageKey: 'doc_1',
        originalSha256Hash: 'doc_1',
        mimeType: 'application/pdf',
      },
    ],
    tags: existingTags.map((tag) => ({
      ...tag,
      organizationId: document.organizationId,
      normalizedName: tag.name,
      color: '#000000',
    })),
  });

  const aiServices = createAiServices({
    config,
    // oxlint-disable-next-line no-console
    logger: { error: console.error } as Logger,
    aiCreditsRepository: createAiCreditsRepository({ db }),
    planEntitlementsRepository: createPlanEntitlementsRepository({ db }),
    plansRepository: createPlansRepository({ config }),
    subscriptionsRepository: createSubscriptionsRepository({ db }),
    planEntitlementDefinitionRegistry: createPlanEntitlementDefinitionRegistry({ config }),
  });

  const applyAutoTaggingActions = vi
    .fn<ReturnType<typeof buildApplyAutoTaggingActions>>()
    .mockResolvedValue();
  const { logger } = createTestLogger();
  const enrichDocument = buildEnrichDocument({
    aiServices,
    documentsRepository: createDocumentsRepository({ db }),
    tagsRepository: createTagsRepository({ db }),
    capabilityDefinitions: [buildTagsEnrichmentCapability({ config, applyAutoTaggingActions })],
    resolveOrganizationSettings: async () => ({
      organizationSettings: {
        ai: {
          autoTagging: { isEnabled: true, canCreateNewTags: false, maxTags: 3, modelId },
        },
      },
    }),
    logger,
  });

  test('document enrichment identifies relevant tags for an invoice', { timeout }, async () => {
    await enrichDocument({ documentId: 'doc_1', organizationId: document.organizationId });

    expect(applyAutoTaggingActions).toHaveBeenCalledTimes(1);
    const [{ tagIdsToAdd, tagsToCreate }] = applyAutoTaggingActions.mock.calls[0]!;
    expect(tagsToCreate).toEqual([]);
    expect(tagIdsToAdd.length).toBeLessThanOrEqual(3);
    expect(tagIdsToAdd).toContain('tag_1'); // the document is unambiguously an invoice
  });
}
