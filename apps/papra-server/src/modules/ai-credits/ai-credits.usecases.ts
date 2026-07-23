import type { ModelUsage } from '../ai/ai.type';
import type { GetOrganizationPlanUsecase } from '../plans/plans.usecases';
import { systemClock } from '../shared/clock/clock';
import type { Clock } from '../shared/clock/clock.types';
import { createError } from '../shared/errors/errors';
import type { AiCreditsRepository } from './ai-credits.repository';
import type { AiCreditsUsageSource } from './ai-credits.types';
import { getCreditsCostForUsage } from './rates/ai-credits.rates.models';

export async function registerAiCreditLlmUsage({
  modelId,
  organizationId,
  usage,
  source,

  aiCreditsRepository,
}: {
  modelId: string;
  organizationId: string;
  usage: ModelUsage;
  source: AiCreditsUsageSource;

  aiCreditsRepository: AiCreditsRepository;
}) {
  const { credits, creditsRate } = getCreditsCostForUsage({ modelId, usage });

  await aiCreditsRepository.registerCreditConsumption({
    organizationId,
    creditsConsumed: credits,
    source,
    usage: {
      type: 'llm-model',
      modelId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      creditsRate,
    },
  });
}

export async function getOrganizationAiCreditsUsage({
  organizationId,
  aiCreditsRepository,
  getOrganizationPlan,
  clock = systemClock,
}: {
  organizationId: string;
  aiCreditsRepository: AiCreditsRepository;
  getOrganizationPlan: GetOrganizationPlanUsecase;
  clock?: Clock;
}) {
  const [{ creditsConsumed }, { organizationPlan }] = await Promise.all([
    aiCreditsRepository.getCurrentPeriodOrganizationAiCreditsCount({ organizationId, clock }),
    getOrganizationPlan({ organizationId }),
  ]);

  const remainingCredits = Math.max(0, organizationPlan.limits.aiCreditsPerMonth - creditsConsumed);

  return {
    creditsConsumed,
    creditsLimit: organizationPlan.limits.aiCreditsPerMonth,
    remainingCredits,
    hasExceededLimit: remainingCredits <= 0,
  };
}

export async function checkOrganizationHasSufficientAiCredits({
  organizationId,
  aiCreditsRepository,
  getOrganizationPlan,
  clock = systemClock,
}: {
  organizationId: string;
  aiCreditsRepository: AiCreditsRepository;
  getOrganizationPlan: GetOrganizationPlanUsecase;
  clock?: Clock;
}) {
  const { hasExceededLimit } = await getOrganizationAiCreditsUsage({
    organizationId,
    aiCreditsRepository,
    getOrganizationPlan,
    clock,
  });

  if (hasExceededLimit) {
    throw createError({
      code: 'ai_credits.limit_exceeded',
      message: 'You have exceeded your AI credits limit for this month.',
      statusCode: 402,
    });
  }
}
