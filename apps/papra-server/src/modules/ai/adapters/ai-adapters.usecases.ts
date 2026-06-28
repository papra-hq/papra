import type { Config } from '../../config/config.types';
import { parseModelId } from '../ai.schemas.models';
import { modelAdapterFactories } from './ai-adapters.registry';
import type { ModelAdapterNames } from './ai-adapters.registry';
import { createError } from '../../shared/errors/errors';
import type { AiAdapter, AiTextAdapter } from './ai-adapters.types';

export function resolveAdapter({
  adapterId,
  config,
}: {
  adapterId?: string;
  config: Config;
}): AiAdapter {
  const adapterName = adapterId ?? config.ai.defaultAdapterName;

  const adapterFactory = modelAdapterFactories[adapterName as ModelAdapterNames];

  if (!adapterFactory) {
    throw createError({
      code: 'ai.adapterNotFound',
      message: `No adapter found for adapter name "${adapterName}"`,
      statusCode: 500,
      isInternal: true,
    });
  }

  const adapter = adapterFactory({ config });

  return adapter;
}

export function resolveTextAdapter({
  modelId,
  config,
}: {
  modelId: string;
  config: Config;
}): AiTextAdapter {
  const { modelName, adapterId } = parseModelId(modelId);

  const adapter = resolveAdapter({ adapterId, config });

  return adapter.getTextAdapter({ modelName });
}
