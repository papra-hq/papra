import { mapValues, objectKeys } from '@papra/std';
import type { Config } from '../../config/config.types';
import type { AiAdapter, AiAdapterFactory } from './ai-adapters.types';
import { OPENAI_COMPATIBLE_ADAPTERS } from './openai-compatible/openai-compatible.providers';
import { buildOpenAiCompatibleTextAdapter } from './openai-compatible/openai-compatible.adapters';

export const modelAdapterFactories = mapValues(
  OPENAI_COMPATIBLE_ADAPTERS,
  (_adapter, name): AiAdapterFactory =>
    ({ config }: { config: Config }): AiAdapter => ({
      getTextAdapter: buildOpenAiCompatibleTextAdapter(config.ai.adapters[name]),
    }),
);

export const modelAdapterNames = objectKeys(modelAdapterFactories);

export type ModelAdapterNames = (typeof modelAdapterNames)[number];
