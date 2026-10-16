import { expect, test } from 'vitest';
import type { Config } from '../../config/config.types';
import { createAiServices } from '../../ai/ai.services';
import { promptForAiExtraction } from '../ai-extraction.usecases';
import {
  getExtractableCustomProperties,
  getPendingExtractionTargets,
} from '../ai-extraction.models';
import type { Logger } from '@crowlog/logger';
import { createAiCreditsRepository } from '../../ai-credits/ai-credits.repository';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createPlanEntitlementsRepository } from '../../plan-entitlements/plan-entitlements.repository';
import { createPlansRepository } from '../../plans/plans.repository';
import { createSubscriptionsRepository } from '../../subscriptions/subscriptions.repository';
import { createPlanEntitlementDefinitionRegistry } from '../../plan-entitlements/plan-entitlements.registry';

const document = {
  name: 'scan.pdf',
  originalName: 'scan.pdf',
  content: [
    'INVOICE #2026-042',
    'Date: 12 March 2024',
    'From: Acme Corp, 123 Main St',
    'To: John Doe',
    'Web hosting services, March 2024',
    'Total due: $1250.00',
    'Status: unpaid',
  ].join('\n'),
  organizationId: 'org_1',
};

const vendorProperty = {
  id: 'cpd_vendor',
  key: 'vendor',
  name: 'Vendor',
  description: 'The company that issued the invoice',
  type: 'text' as const,
  options: [],
};

const amountProperty = {
  id: 'cpd_amount',
  key: 'amount',
  name: 'Amount',
  description: 'The total amount due as a number',
  type: 'number' as const,
  options: [],
};

export async function runAiExtractionTestSuite({
  modelId,
  config,
  timeout = 120_000,
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

  test(
    'extraction should return a document date, vendor, amount, and filename',
    { timeout },
    async () => {
      const extractableProperties = getExtractableCustomProperties({
        propertyDefinitions: [vendorProperty, amountProperty],
      });
      const targets = getPendingExtractionTargets({
        document: { name: document.name, originalName: document.originalName, documentDate: null },
        settings: {
          isEnabled: true,
          extractDate: true,
          extractCustomProperties: true,
          renameDocuments: true,
          filenamePattern: '{date} - {vendor}',
        },
        extractableProperties,
        existingPropertyDefinitionIds: new Set(),
      });

      const response = await promptForAiExtraction({
        aiServices,
        document,
        targets,
        filenamePattern: '{date} - {vendor}',
        modelId,
      });

      expect(response.documentDate).toMatch(/2024-03-12/);
      expect(String(response.customProperties?.vendor ?? '').toLowerCase()).toContain('acme');
      expect(Number(response.customProperties?.amount)).toBeGreaterThan(1000);
      expect(response.filename).toBeTruthy();
    },
  );
}
