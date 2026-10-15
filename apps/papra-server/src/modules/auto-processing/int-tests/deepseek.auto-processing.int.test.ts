import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoProcessingTestSuite } from './auto-processing.int.test-suites';

const apiKey = process.env.TEST_DEEPSEEK_API_KEY;
const modelId = process.env.TEST_DEEPSEEK_MODEL_ID;

describe('auto-processing ai integration', () => {
  describe.skipIf(!apiKey || !modelId)('deepseek', async () => {
    await runAutoProcessingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { deepseek: { apiKey } } } }),
    });
  });
});
