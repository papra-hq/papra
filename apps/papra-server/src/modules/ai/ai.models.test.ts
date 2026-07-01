import { describe, expect, test } from 'vitest';
import { parseModelId, isValidModelId } from './ai.models';

describe('ai.models', () => {
  describe('parseModelId', () => {
    test('given a model id in the format "adapter://modelName", it parses and returns the modelName and adapterId', () => {
      expect(parseModelId('openai://gpt-4')).to.eql({
        adapterId: 'openai',
        modelName: 'gpt-4',
      });
    });

    test('adapterIds are garranteed to not contain "://" so the modelName can contain "://"', () => {
      expect(parseModelId('adapter://foo:bar://baz')).to.eql({
        adapterId: 'adapter',
        modelName: 'foo:bar://baz',
      });
    });

    test('the adapterId is required, so if the model id does not contain "://" it throws an error', () => {
      expect(() => parseModelId('gpt-4')).to.throw(
        'Invalid model identifier: "gpt-4". Expected format is "adapterId://modelName"',
      );
    });

    test('if the model id is in the format "adapter://", it throws an error', () => {
      expect(() => parseModelId('adapter://')).to.throw(
        'Invalid model identifier: "adapter://". Expected format is "adapterId://modelName"',
      );

      expect(() => parseModelId('://')).to.throw(
        'Invalid model identifier: "://". Expected format is "adapterId://modelName"',
      );

      expect(() => parseModelId('')).to.throw(
        'Invalid model identifier: "". Expected format is "adapterId://modelName"',
      );
    });
  });

  describe('isValidModelId', () => {
    test('a valid model must be in the format "adapter://modelName"', () => {
      expect(isValidModelId('openai://gpt-4')).to.eql(true);
      expect(isValidModelId('openrouter://openai/gpt-4')).to.eql(true);
      expect(isValidModelId('adapter://foo:bar://baz')).to.eql(true);

      expect(isValidModelId('gpt-4')).to.eql(false);
      expect(isValidModelId('adapter://')).to.eql(false);
      expect(isValidModelId('')).to.eql(false);
    });
  });
});
