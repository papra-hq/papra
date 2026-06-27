import { objectKeys } from '@papra/std';
import type { AiAdapterFactory } from './ai-adapters.types';
import { buildOllamaAdapter, OLLAMA_ADAPTER_NAME } from './ollama/ollama.ai-adapters';
import { buildOpenAiAdapter, OPENAI_ADAPTER_NAME } from './openai/openai.ai-adapters';
import { buildMistralAdapter, MISTRAL_ADAPTER_NAME } from './mistral/mistral.ai-adapters';

export const modelAdapterFactories = {
  [OLLAMA_ADAPTER_NAME]: buildOllamaAdapter,
  [OPENAI_ADAPTER_NAME]: buildOpenAiAdapter,
  [MISTRAL_ADAPTER_NAME]: buildMistralAdapter,
} satisfies Record<string, AiAdapterFactory>;

export const modelAdapterNames = objectKeys(modelAdapterFactories);

export type ModelAdapterNames = (typeof modelAdapterNames)[number];
