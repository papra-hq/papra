import { openaiCompatibleText } from '@tanstack/ai-openai/compatible';
import type { OpenAiCompatibleAdapterConfig } from './openai-compatible.ai-adapters.schemas';

export function getOpenAiCompatibleModelAdapter({
  modelName,
  adapterConfig,
}: {
  modelName: string;
  adapterConfig: OpenAiCompatibleAdapterConfig;
}) {
  const { baseUrl, ...rest } = adapterConfig;

  return {
    adapter: openaiCompatibleText(modelName, {
      baseURL: baseUrl,
      ...rest,
    }),
  };
}
