import { describe, expect, test } from 'vitest';
import { extractTextWithVlm } from './vlm.content-extraction-strategy.usecases';
import { createAiServices } from '../../../../ai/ai.services';
import { createInMemoryDatabase } from '../../../../app/database/database.test-utils';
import { createAiCreditsRepository } from '../../../../ai-credits/ai-credits.repository';
import { createPlanEntitlementsRepository } from '../../../../plan-entitlements/plan-entitlements.repository';
import { overrideConfig } from '../../../../config/config.test-utils';
import { createPlanEntitlementDefinitionRegistry } from '../../../../plan-entitlements/plan-entitlements.registry';
import { createPlansRepository } from '../../../../plans/plans.repository';
import { createSubscriptionsRepository } from '../../../../subscriptions/subscriptions.repository';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('vlm content extraction strategy', () => {
  describe('integration test using real providers', () => {
    (
      [
        {
          label: 'anthropic',
          modelId: 'anthropic://claude-sonnet-5',
          apiKey: process.env.TEST_ANTHROPIC_API_KEY,
        },
        {
          label: 'openai',
          modelId: 'openai://gpt-5.2',
          apiKey: process.env.TEST_OPENAI_API_KEY,
        },
      ] as const
    )
      .filter(({ apiKey }) => Boolean(apiKey))
      .forEach(({ label, modelId, apiKey }) => {
        describe(label, async () => {
          const { db } = await createInMemoryDatabase({
            organizations: [{ id: 'org_1', name: 'Test Organization' }],
          });
          const config = overrideConfig({
            ai: {
              adapters: {
                [label]: {
                  apiKey,
                },
              },
            },
          });

          const aiServices = createAiServices({
            aiCreditsRepository: createAiCreditsRepository({ db }),
            planEntitlementsRepository: createPlanEntitlementsRepository({ db }),
            config,
            planEntitlementDefinitionRegistry: createPlanEntitlementDefinitionRegistry({ config }),
            plansRepository: createPlansRepository({ config }),
            subscriptionsRepository: createSubscriptionsRepository({ db }),
          });

          test('scanned pdf', { timeout: 30_000 }, async () => {
            const pdfBody = await readFile(join(import.meta.dirname, 'fixtures', 'scanned.pdf'));
            const file = new File([pdfBody], 'scanned.pdf', { type: 'application/pdf' });

            const { text } = await extractTextWithVlm({
              aiServices,
              modelId,
              organizationId: 'org_1',
              file,
            });

            // oxlint-disable-next-line no-console
            console.log({ text });

            expect(text.length > 200).to.eql(true);
            expect(text.toLowerCase().includes('look scanned')).to.eql(true);
          });
        });
      });
  });
});
