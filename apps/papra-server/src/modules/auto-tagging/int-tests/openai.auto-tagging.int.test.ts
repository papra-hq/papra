import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoTaggingTestSuite } from './auto-tagging.int.test-suites';

const apiKey = process.env.TEST_OPENAI_API_KEY;
const modelId = process.env.TEST_OPENAI_MODEL_ID;

describe('auto-tagging ai integration', () => {
  describe.skipIf(!apiKey || !modelId)('openai', async () => {
    await runAutoTaggingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { openai: { apiKey } } } }),
    });
  });
});
