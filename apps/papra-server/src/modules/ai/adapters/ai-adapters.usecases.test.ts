import { describe, expect, test } from 'vitest';
import { OPENAI_COMPATIBLE_ADAPTER_NAME } from './openai-compatible/openai-compatible.ai-adapters.constants';
import type { AiModelAdapterConfig } from './ai-adapters.schemas';
import { resolveModelAdapter } from './ai-adapters.usecases';

function createOpenAiCompatibleAdapterConfig(
  overrides: Partial<AiModelAdapterConfig> = {},
): AiModelAdapterConfig {
  return {
    id: 'adapter-1',
    adapter: OPENAI_COMPATIBLE_ADAPTER_NAME,
    baseUrl: 'https://example.com',
    apiKey: 'sk-test',
    ...overrides,
  };
}

describe('ai-adapters.usecases', () => {
  describe('resolveModelAdapter', () => {
    test('resolves the only configured adapter when no adapterId is provided', () => {
      const { adapter } = resolveModelAdapter({
        model: { modelName: 'gpt-4o' },
        adaptersConfig: [createOpenAiCompatibleAdapterConfig()],
      });

      expect(adapter.model).toBe('gpt-4o');
    });

    test('resolves the adapter matching the given adapterId when multiple are configured', () => {
      const { adapter } = resolveModelAdapter({
        model: { modelName: 'gpt-4o-mini', adapterId: 'second' },
        adaptersConfig: [
          createOpenAiCompatibleAdapterConfig({
            id: 'first',
            baseUrl: 'https://first.example.com',
          }),
          createOpenAiCompatibleAdapterConfig({
            id: 'second',
            baseUrl: 'https://second.example.com',
          }),
        ],
      });

      // The matching adapter is resolved and the requested model name is forwarded to it.
      expect(adapter.model).toBe('gpt-4o-mini');
    });

    test('throws when no adapters are configured', () => {
      expect(() =>
        resolveModelAdapter({
          model: { modelName: 'gpt-4o' },
          adaptersConfig: [],
        }),
      ).toThrow('No adapters configured');
    });

    test('throws when multiple adapters are configured but no adapterId is provided', () => {
      expect(() =>
        resolveModelAdapter({
          model: { modelName: 'gpt-4o' },
          adaptersConfig: [
            createOpenAiCompatibleAdapterConfig({ id: 'first' }),
            createOpenAiCompatibleAdapterConfig({ id: 'second' }),
          ],
        }),
      ).toThrow('Multiple adapters configured, but no adapterId provided');
    });

    test('throws when the provided adapterId does not match any configured adapter', () => {
      expect(() =>
        resolveModelAdapter({
          model: { modelName: 'gpt-4o', adapterId: 'unknown' },
          adaptersConfig: [
            createOpenAiCompatibleAdapterConfig({ id: 'first' }),
            createOpenAiCompatibleAdapterConfig({ id: 'second' }),
          ],
        }),
      ).toThrow('Adapter config not found for adapterId: unknown');
    });

    test('throws when no factory is registered for the resolved adapter', () => {
      const adapterConfig = {
        ...createOpenAiCompatibleAdapterConfig(),
        adapter: 'unregistered-adapter',
      } as unknown as AiModelAdapterConfig;

      expect(() =>
        resolveModelAdapter({
          model: { modelName: 'gpt-4o' },
          adaptersConfig: [adapterConfig],
        }),
      ).toThrow('Adapter factory not found');
    });
  });
});
