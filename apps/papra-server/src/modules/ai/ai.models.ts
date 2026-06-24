import { createError } from '../shared/errors/errors';
import type { ModelConfig } from './ai.type';

export function ensureModel(model: ModelConfig | undefined | null): ModelConfig {
  if (!model) {
    throw createError({
      code: 'ai.model_not_configured',
      message: 'AI model is not configured. Please configure a model in the settings.',
      statusCode: 500,
      isInternal: true,
    });
  }

  return model;
}
