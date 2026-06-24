import { describe, expect, test } from 'vitest';
import { parseModelId } from './ai.schemas.models';

describe('ai.schemas.models', () => {
  describe('parseModelId', () => {
    test('given a model id in the format "adapter:modelName", it parses and returns the modelName and adapterId', () => {
      expect(parseModelId('openai-compatible:gpt-4')).to.eql({
        adapterId: 'openai-compatible',
        modelName: 'gpt-4',
      });
    });

    test('adapterIds are garranteed to not contain ":" so the modelName can contain ":"', () => {
      expect(parseModelId('adapter:foo:bar:baz')).to.eql({
        adapterId: 'adapter',
        modelName: 'foo:bar:baz',
      });
    });

    test('throws an error if the model id is not in the expected format', () => {
      expect(() => parseModelId('invalidModelId')).toThrowError(
        'Invalid model identifier: invalidModelId. Expected format is "adapterId:modelName"',
      );
    });
  });
});
