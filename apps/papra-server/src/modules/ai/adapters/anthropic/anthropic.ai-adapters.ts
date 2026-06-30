import type { Config } from '../../../config/config.types';
import type { AiAdapter } from '../ai-adapters.types';
import { createAnthropicChat } from '@tanstack/ai-anthropic';
import type { AnthropicChatModel } from '@tanstack/ai-anthropic';

export function buildAnthropicAdapter({ config }: { config: Config }): AiAdapter {
  const { apiKey, baseUrl } = config.ai.adapters.anthropic;

  return {
    getTextAdapter: ({ modelName }) => {
      return createAnthropicChat(
        modelName as AnthropicChatModel,
        apiKey,
        baseUrl ? { baseURL: baseUrl } : undefined,
      );
    },
  };
}
