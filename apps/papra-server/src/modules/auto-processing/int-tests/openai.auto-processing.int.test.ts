import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoProcessingTestSuite } from './auto-processing.int.test-suites';

const apiKey = process.env.TEST_OPENAI_API_KEY;
const modelId = process.env.TEST_OPENAI_MODEL_ID;

describe('auto-processing ai integration', () => {
  describe.skipIf(!apiKey || !modelId)('openai', async () => {
    await runAutoProcessingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { openai: { apiKey } } } }),
    });
  });
});
