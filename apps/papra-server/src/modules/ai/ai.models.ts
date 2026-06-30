import { createError } from '../shared/errors/errors';
import { isNilOrEmptyString } from '../shared/utils';
import { ADAPTER_MODEL_SEPARATOR } from './ai.constants';

export function ensureModelId(model: string | undefined | null): string {
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

export function parseModelId(modelId: string): { adapterId: string; modelName: string } {
  if (isNilOrEmptyString(modelId) || !modelId.includes(ADAPTER_MODEL_SEPARATOR)) {
    throw new Error(
      `Invalid model identifier: "${modelId}". Expected format is "adapterId${ADAPTER_MODEL_SEPARATOR}modelName"`,
    );
  }

  const [adapterId, ...modelNameParts] = modelId.split(ADAPTER_MODEL_SEPARATOR);
  const modelName = modelNameParts.join(ADAPTER_MODEL_SEPARATOR);

  if (isNilOrEmptyString(modelName) || isNilOrEmptyString(adapterId)) {
    throw new Error(
      `Invalid model identifier: "${modelId}". Expected format is "adapterId${ADAPTER_MODEL_SEPARATOR}modelName"`,
    );
  }

  return { adapterId, modelName };
}

export function isValidModelId(modelId: string): boolean {
  try {
    parseModelId(modelId);

    return true;
  } catch {
    return false;
  }
}
