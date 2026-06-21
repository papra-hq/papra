import type { ModelConfig } from '../ai.type';
import { modelAdapterFactories } from './ai-adapters.registry';
import type { ModelAdapterNames } from './ai-adapters.registry';
import type { AiModelAdapterListConfig } from './ai-adapters.schemas';

export function resolveModelAdapter({
  modelConfig,
  adaptersConfig,
}: {
  modelConfig: ModelConfig;
  adaptersConfig: AiModelAdapterListConfig;
}) {
  const { modelName, adapterId } = modelConfig;

  const adapterConfig = adaptersConfig.find((adapter) => adapter.id === adapterId);

  if (!adapterConfig) {
    throw new Error(`Adapter config not found for adapterId: ${adapterId}`);
  }

  const factory = modelAdapterFactories[adapterId as ModelAdapterNames];

  if (!factory) {
    throw new Error(`Adapter factory not found for adapterId: ${adapterId}`);
  }

  return factory({ modelName, adapterConfig });
}
