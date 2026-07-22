import type { Logger } from '@crowlog/logger';
import type { Config } from '../config/config.types';
import { resolveTextAdapter } from './adapters/ai-adapters.usecases';
import { EventType, chat as tanstackChat } from '@tanstack/ai';
import type { ChatMiddleware } from '@tanstack/ai';
import { toStandardJsonSchema } from '@valibot/to-json-schema';
import type { GenericSchema, InferOutput } from 'valibot';
import { createLogger } from '../shared/logger/logger';
import { createAiCreditsMiddleware } from '../ai-credits/ai-credits.middlewares';
import type { AiCreditsUsageSource } from '../ai-credits/ai-credits.types';
import type { AiCreditsRepository } from '../ai-credits/ai-credits.repository';
import { checkOrganizationHasSufficientAiCredits } from '../ai-credits/ai-credits.usecases';
import { createGetOrganizationPlanUsecase } from '../plans/plans.usecases';
import type { PlansRepository } from '../plans/plans.repository';
import type { PlanEntitlementDefinitionRegistry } from '../plan-entitlements/plan-entitlements.registry';
import type { PlanEntitlementsRepository } from '../plan-entitlements/plan-entitlements.repository';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';

export type AiServices = ReturnType<typeof createAiServices>;

export function createAiServices({
  config,
  aiCreditsRepository,
  plansRepository,
  planEntitlementDefinitionRegistry,
  planEntitlementsRepository,
  subscriptionsRepository,
  logger = createLogger({ namespace: 'ai.services' }),
}: {
  config: Config;
  aiCreditsRepository: AiCreditsRepository;
  plansRepository: PlansRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  planEntitlementsRepository: PlanEntitlementsRepository;
  subscriptionsRepository: SubscriptionsRepository;
  logger?: Logger;
}) {
  // Not using injectArguments here: it relies on Parameters/ReturnType, which collapse the
  // `Schema` type parameter to its constraint, making the result `unknown`. A thin generic
  // wrapper preserves inference so callers get back InferOutput<Schema>.
  return {
    generateStructuredData: async <Schema extends GenericSchema>(args: {
      modelId: string;
      schema: Schema;
      userPrompt: string;
      systemPrompt?: string;
      source: AiCreditsUsageSource;
      organizationId: string;
    }): Promise<InferOutput<Schema>> =>
      generateStructuredData({
        ...args,
        config,
        logger,
        aiCreditsRepository,
        plansRepository,
        planEntitlementDefinitionRegistry,
        planEntitlementsRepository,
        subscriptionsRepository,
      }),
  };
}

async function generateStructuredData<Schema extends GenericSchema>({
  modelId,
  schema,
  userPrompt,
  systemPrompt,
  source,
  organizationId,
  aiCreditsRepository,
  config,
  logger,
  plansRepository,
  planEntitlementDefinitionRegistry,
  planEntitlementsRepository,
  subscriptionsRepository,
}: {
  modelId: string;
  schema: Schema;
  userPrompt: string;
  systemPrompt?: string;
  source: AiCreditsUsageSource;
  organizationId: string;
  config: Config;
  logger: Logger;
  aiCreditsRepository: AiCreditsRepository;
  plansRepository: PlansRepository;
  planEntitlementDefinitionRegistry: PlanEntitlementDefinitionRegistry;
  planEntitlementsRepository: PlanEntitlementsRepository;
  subscriptionsRepository: SubscriptionsRepository;
}): Promise<InferOutput<Schema>> {
  const adapter = resolveTextAdapter({
    modelId,
    config,
  });

  await checkOrganizationHasSufficientAiCredits({
    organizationId,
    aiCreditsRepository,
    getOrganizationPlan: createGetOrganizationPlanUsecase({
      plansRepository,
      planEntitlementDefinitionRegistry,
      planEntitlementsRepository,
      subscriptionsRepository,
    }),
  });

  const jsonSchema = toStandardJsonSchema(schema);

  const data = await tanstackChat({
    adapter,
    messages: userPrompt ? [{ role: 'user', content: userPrompt }] : undefined,
    outputSchema: jsonSchema,
    systemPrompts: systemPrompt ? [systemPrompt] : undefined,
    middleware: [
      createLogMiddleware({ logger, context: { modelId } }),
      createAiCreditsMiddleware({
        modelId,
        organizationId,
        source,
        logger,
        aiCreditsRepository,
      }),
    ],
  });

  return data;
}

function createLogMiddleware({
  logger,
  context,
}: {
  logger: Logger;
  context: Record<string, unknown>;
}): ChatMiddleware {
  return {
    name: 'log',
    onChunk: (_ctx, chunk) => {
      if (chunk.type === EventType.RUN_ERROR) {
        logger.error(
          {
            error: {
              message: chunk.message,
              code: chunk.code,
            },
            ...context,
          },
          'Error generating structured data',
        );
      }
    },
  };
}
