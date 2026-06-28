import { objectKeys } from '@papra/std';
import type { AiAdapterFactory } from './ai-adapters.types';
import { buildOllamaAdapter } from './ollama/ollama.ai-adapters';
import { buildOpenAiAdapter } from './openai/openai.ai-adapters';
import { buildMistralAdapter } from './mistral/mistral.ai-adapters';
import type { AiAdapterName } from './ai-adapters.constants';
import { AI_ADAPTERS } from './ai-adapters.constants';

export const modelAdapterFactories = {
  [AI_ADAPTERS.ollama]: buildOllamaAdapter,
  [AI_ADAPTERS.openai]: buildOpenAiAdapter,
  [AI_ADAPTERS.mistral]: buildMistralAdapter,
} satisfies Record<AiAdapterName, AiAdapterFactory>;

export const modelAdapterNames = objectKeys(modelAdapterFactories);

export type ModelAdapterNames = (typeof modelAdapterNames)[number];
