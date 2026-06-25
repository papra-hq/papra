import { isNilOrEmptyString } from '../shared/utils';
import { ADAPTER_MODEL_SEPARATOR } from './ai.constants';

export function parseModelId(modelId: string): { adapterId?: string; modelName: string } {
  if (isNilOrEmptyString(modelId)) {
    throw new Error(
      `Invalid model identifier: "${modelId}". Expected format is "adapterId${ADAPTER_MODEL_SEPARATOR}modelName"`,
    );
  }

  if (!modelId.includes(ADAPTER_MODEL_SEPARATOR)) {
    return { adapterId: undefined, modelName: modelId };
  }

  const [adapterId, ...modelNameParts] = modelId.split(ADAPTER_MODEL_SEPARATOR);
  const modelName = modelNameParts.join(ADAPTER_MODEL_SEPARATOR);

  if (isNilOrEmptyString(modelName)) {
    throw new Error(
      `Invalid model identifier: "${modelId}". Expected format is "adapterId${ADAPTER_MODEL_SEPARATOR}modelName"`,
    );
  }

  return { adapterId, modelName };
}

export function parseOptionalModelId(modelId: string | undefined | null) {
  if (isNilOrEmptyString(modelId)) {
    return undefined;
  }

  return parseModelId(modelId);
}
