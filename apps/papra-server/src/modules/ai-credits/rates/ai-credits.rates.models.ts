import type { ModelUsage } from '../../ai/ai.type';
import { isNil } from '../../shared/utils';
import type { ModelCreditRate } from './ai-credits.rates';
import { modelCreditRates } from './ai-credits.rates';
import { createModelCreditRateNotFoundError } from './ai-credits.rates.errors';

export function getCreditsCostForUsage({
  modelId,
  usage,
  modelRates = modelCreditRates,
}: {
  modelId: string;
  usage: ModelUsage;
  modelRates?: Record<string, ModelCreditRate>;
}): {
  credits: number;
  creditsRate: ModelCreditRate;
} {
  const creditsRate = modelRates[modelId];

  if (isNil(creditsRate)) {
    throw createModelCreditRateNotFoundError();
  }

  const credits = computeCreditsForTokens({
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    creditsRate,
  });

  return {
    credits,
    creditsRate,
  };
}

export function computeCreditsForTokens({
  inputTokens,
  outputTokens,
  creditsRate,
}: {
  inputTokens: number;
  outputTokens: number;
  creditsRate: ModelCreditRate;
}): number {
  const inputCredits = (inputTokens / 1_000_000) * creditsRate.creditsPerMillionInputTokens;
  const outputCredits = (outputTokens / 1_000_000) * creditsRate.creditsPerMillionOutputTokens;

  return Math.max(1, Math.ceil(inputCredits + outputCredits));
}
