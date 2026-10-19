import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoProcessingTestSuite } from './auto-processing.int.test-suites';

const apiKey = process.env.TEST_MISTRAL_API_KEY;
const modelId = process.env.TEST_MISTRAL_MODEL_ID;

describe('auto-processing ai integration', () => {
  describe.skipIf(!apiKey || !modelId)('mistral', async () => {
    await runAutoProcessingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { mistral: { apiKey } } } }),
    });
  });
});
