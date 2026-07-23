import { expect, test } from 'vitest';
import type { Config } from '../../config/config.types';
import { createAiServices } from '../../ai/ai.services';
import { promptForAutoTagging } from '../auto-tagging.usecases';
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
  config,
  timeout = 20_000,
}: {
  modelId: string;
  config: Config;
  timeout?: number;
}) {
  const { db } = await createInMemoryDatabase();

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

  test('auto-tagging should correctly identify tags for a document', { timeout }, async () => {
    const { tagIdsToAdd, tagsToCreate } = await promptForAutoTagging({
      existingTags,
      modelId,
      aiServices,
      canCreateNewTags: false,
      document,
      maxTags: 3,
    });

    expect(tagsToCreate).toEqual([]);
    expect(tagIdsToAdd.length).toBeLessThanOrEqual(3);
    expect(tagIdsToAdd).toContain('tag_1'); // the document is unambiguously an invoice
  });
}
