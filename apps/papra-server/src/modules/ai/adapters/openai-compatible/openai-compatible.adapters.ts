import { openaiCompatibleText } from '@tanstack/ai-openai/compatible';

export type OpenAiCompatibleAdapterConfig = {
  baseUrl: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
  defaultQuery?: Record<string, string>;
  organization?: string;
  project?: string;
};

export function buildOpenAiCompatibleTextAdapter({
  baseUrl,
  ...rest
}: OpenAiCompatibleAdapterConfig) {
  return ({ modelName }: { modelName: string }) =>
    openaiCompatibleText(modelName, {
      baseURL: baseUrl,
      ...rest,
    });
}
