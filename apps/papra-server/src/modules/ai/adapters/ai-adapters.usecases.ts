import type { ModelConfig } from '../ai.type';
import { modelAdapterFactories } from './ai-adapters.registry';
import type { AiModelAdapterListConfig } from './ai-adapters.schemas';

export function resolveModelAdapter({
  model,
  adaptersConfig,
}: {
  model: ModelConfig;
  adaptersConfig: AiModelAdapterListConfig;
}) {
  const { modelName, adapterId } = model;

  const adapterConfig = adaptersConfig.find((adapter) => adapter.id === adapterId);

  if (!adapterConfig) {
    throw new Error(`Adapter config not found for adapterId: ${adapterId}`);
  }

  const factory = modelAdapterFactories[adapterConfig.adapter];

  if (!factory) {
    throw new Error(`Adapter factory not found for adapterId: ${adapterId}`);
  }

  return factory({ modelName, adapterConfig });
}
