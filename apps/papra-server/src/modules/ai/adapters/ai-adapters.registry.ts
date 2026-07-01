import { mapValues, objectKeys } from '@papra/std';
import type { Config } from '../../config/config.types';
import type { AiAdapter, AiAdapterFactory } from './ai-adapters.types';
import { OPENAI_COMPATIBLE_ADAPTERS } from './openai-compatible/openai-compatible.providers';
import { buildOpenAiCompatibleTextAdapter } from './openai-compatible/openai-compatible.adapters';
import type { AiAdapterName } from './ai-adapters.constants';
import { buildAnthropicAdapter } from './anthropic/anthropic.ai-adapters';

const openaiCompatibleAdapterFactories = mapValues(
  OPENAI_COMPATIBLE_ADAPTERS,
  (_adapter, name): AiAdapterFactory =>
    ({ config }: { config: Config }): AiAdapter => ({
      getTextAdapter: buildOpenAiCompatibleTextAdapter(config.ai.adapters[name]),
    }),
);

export const modelAdapterFactories = {
  ...openaiCompatibleAdapterFactories,
  anthropic: buildAnthropicAdapter,
} as const satisfies Record<AiAdapterName, AiAdapterFactory>;

export const modelAdapterNames = objectKeys(modelAdapterFactories);

export type ModelAdapterNames = (typeof modelAdapterNames)[number];
