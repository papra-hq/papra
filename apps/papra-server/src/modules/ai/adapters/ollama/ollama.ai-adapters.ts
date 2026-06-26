import type { Config } from '../../../config/config.types';
import type { AiAdapter } from '../ai-adapters.types';
import { buildOpenAiCompatibleTextAdapter } from '../openai/openai-compatible.ai-adapters';

export const OLLAMA_ADAPTER_NAME = 'ollama';

export function buildOllamaAdapter({ config }: { config: Config }): AiAdapter {
  const adapterConfig = config.ai.adapters.ollama;

  return {
    name: OLLAMA_ADAPTER_NAME,

    getTextAdapter: buildOpenAiCompatibleTextAdapter(adapterConfig),
  };
}
