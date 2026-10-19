import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoProcessingTestSuite } from './auto-processing.int.test-suites';

const baseUrl = process.env.TEST_OLLAMA_BASE_URL;
const modelId = process.env.TEST_OLLAMA_MODEL_ID;

describe('auto-processing ai integration', () => {
  describe.skipIf(!baseUrl || !modelId)('ollama', async () => {
    await runAutoProcessingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { ollama: { baseUrl } } } }),
    });
  });
});
