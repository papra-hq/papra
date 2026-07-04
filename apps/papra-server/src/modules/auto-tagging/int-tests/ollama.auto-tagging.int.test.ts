import { describe } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { runAutoTaggingTestSuite } from './auto-tagging.int.test-suites';

const baseUrl = process.env.TEST_OLLAMA_BASE_URL;
const modelId = process.env.TEST_OLLAMA_MODEL_ID;

describe('auto-tagging ai integration', () => {
  describe.skipIf(!baseUrl || !modelId)('ollama', () => {
    runAutoTaggingTestSuite({
      modelId: modelId!,
      config: overrideConfig({ ai: { adapters: { ollama: { baseUrl } } } }),
    });
  });
});
