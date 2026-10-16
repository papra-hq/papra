import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAiExtractionTestSuite } from './ai-extraction.int.test-suites';

const baseUrl = process.env.TEST_OLLAMA_BASE_URL;
const modelId = process.env.TEST_OLLAMA_MODEL_ID;

describe('ai-extraction ai integration', () => {
  describe.skipIf(!baseUrl || !modelId)('ollama', async () => {
    await runAiExtractionTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { ollama: { baseUrl } } } }),
      timeout: 900_000,
    });
  });
});
