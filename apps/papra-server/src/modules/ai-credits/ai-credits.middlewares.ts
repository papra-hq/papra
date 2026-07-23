import type { ChatMiddleware, UsageInfo } from '@tanstack/ai';
import { registerAiCreditLlmUsage } from './ai-credits.usecases';
import type { AiCreditsUsageSource } from './ai-credits.types';
import type { AiCreditsRepository } from './ai-credits.repository';
import type { Logger } from '@crowlog/logger';
import { safely } from '@corentinth/chisels';

export function createAiCreditsMiddleware({
  modelId,
  organizationId,
  source,
  aiCreditsRepository,
  logger,
}: {
  modelId: string;
  organizationId: string;
  source: AiCreditsUsageSource;
  aiCreditsRepository: AiCreditsRepository;
  logger: Logger;
}): ChatMiddleware {
  return {
    name: 'ai-credits',
    onUsage: (ctx, usage) => {
      ctx.defer(
        handleOnUsage({
          modelId,
          organizationId,
          usage,
          source,
          logger,
          aiCreditsRepository,
        }),
      );
    },
  };
}

export function parseUsageInfo(
  usage: UsageInfo,
  logger: Logger,
): { inputTokens: number; outputTokens: number } {
  const inputTokens = usage.promptTokens;
  const outputTokens = usage.completionTokens;

  if (inputTokens + outputTokens !== usage.totalTokens) {
    logger.warn({ usage }, 'Usage info does not match total tokens');

    return {
      inputTokens: Math.max(0, usage.totalTokens - outputTokens),
      outputTokens,
    };
  }

  return { inputTokens, outputTokens };
}

async function handleOnUsage({
  modelId,
  organizationId,
  source,
  usage,
  aiCreditsRepository,
  logger,
}: {
  modelId: string;
  organizationId: string;
  source: AiCreditsUsageSource;
  usage: UsageInfo;
  logger: Logger;
  aiCreditsRepository: AiCreditsRepository;
}) {
  const { inputTokens, outputTokens } = parseUsageInfo(usage, logger);

  const [, error] = await safely(
    registerAiCreditLlmUsage({
      modelId,
      organizationId,
      usage: { inputTokens, outputTokens },
      source,
      aiCreditsRepository,
    }),
  );

  if (error) {
    logger.error(
      { error, modelId, organizationId, source, usage },
      'Failed to register AI credit usage',
    );
  }
}
