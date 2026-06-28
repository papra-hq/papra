import type { Config } from '../../../config/config.types';
import type { AiAdapter } from '../ai-adapters.types';
import { buildOpenAiCompatibleTextAdapter } from '../openai/openai-compatible.ai-adapters';

export function buildMistralAdapter({ config }: { config: Config }): AiAdapter {
  const adapterConfig = config.ai.adapters.mistral;

  return {
    getTextAdapter: buildOpenAiCompatibleTextAdapter(adapterConfig),
  };
}
