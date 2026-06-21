import { OPENAI_COMPATIBLE_ADAPTER_NAME } from './openai-compatible/openai-compatible.ai-adapters.constants';
import { getOpenAiCompatibleModelAdapter } from './openai-compatible/openai-compatible.ai-adapters';

export const modelAdapterFactories = {
  [OPENAI_COMPATIBLE_ADAPTER_NAME]: getOpenAiCompatibleModelAdapter,
};

export type ModelAdapterNames = keyof typeof modelAdapterFactories;
