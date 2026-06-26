import { describe, expect, test } from 'vitest';
import { parseModelId } from './ai.schemas.models';

describe('ai.schemas.models', () => {
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

    test('the adapterId is optional, so if the model id does not contain "://" it returns the modelName and undefined adapterId', () => {
      expect(parseModelId('gpt-4')).to.eql({
        adapterId: undefined,
        modelName: 'gpt-4',
      });
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
});
