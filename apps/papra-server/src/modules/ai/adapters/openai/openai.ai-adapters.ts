import type { Config } from '../../../config/config.types';
import type { AiAdapter } from '../ai-adapters.types';
import { buildOpenAiCompatibleTextAdapter } from './openai-compatible.ai-adapters';

export const OPENAI_ADAPTER_NAME = 'openai';

export function buildOpenAiAdapter({ config }: { config: Config }): AiAdapter {
  const adapterConfig = config.ai.adapters.openai;

  return {
    name: OPENAI_ADAPTER_NAME,

    getTextAdapter: buildOpenAiCompatibleTextAdapter(adapterConfig),
  };
}
