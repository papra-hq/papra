import { isNil } from '../../shared/utils';
import type { ModelConfig } from '../ai.type';
import { modelAdapterFactories } from './ai-adapters.registry';
import type { AiModelAdapterListConfig } from './ai-adapters.schemas';

export function getAdapterConfig({
  adapterId,
  adaptersConfig,
}: {
  adapterId?: string;
  adaptersConfig: AiModelAdapterListConfig;
}) {
  const adaptersCount = adaptersConfig.length;

  if (adaptersCount === 0) {
    throw new Error('No adapters configured');
  }

  if (adaptersCount > 1 && isNil(adapterId)) {
    throw new Error('Multiple adapters configured, but no adapterId provided');
  }

  if (adaptersCount === 1 && isNil(adapterId)) {
    return { adapterConfig: adaptersConfig[0]! };
  }

  const adapterConfig = adaptersConfig.find((adapter) => adapter.id === adapterId);

  if (!adapterConfig) {
    throw new Error(`Adapter config not found for adapterId: ${adapterId}`);
  }

  return { adapterConfig };
}

export function resolveModelAdapter({
  model,
  adaptersConfig,
}: {
  model: ModelConfig;
  adaptersConfig: AiModelAdapterListConfig;
}) {
  const { modelName, adapterId } = model;

  const { adapterConfig } = getAdapterConfig({ adapterId, adaptersConfig });

  const factory = modelAdapterFactories[adapterConfig.adapter];

  if (!factory) {
    throw new Error(`Adapter factory not found for adapterId: ${adapterId}`);
  }

  return factory({ modelName, adapterConfig });
}
