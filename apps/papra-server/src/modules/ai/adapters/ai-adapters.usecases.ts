import type { AnyTextAdapter } from '@tanstack/ai';
import type { Config } from '../../config/config.types';
import { parseModelId } from '../ai.schemas.models';
import { modelAdapterFactories } from './ai-adapters.registry';
import type { ModelAdapterNames } from './ai-adapters.registry';
import { createError } from '../../shared/errors/errors';

export function resolveTextAdapter({
  modelId,
  config,
}: {
  modelId: string;
  config: Config;
}): AnyTextAdapter {
  const { modelName, adapterId } = parseModelId(modelId);

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

  return adapter.getTextAdapter({ modelName });
}
