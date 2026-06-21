import { isNilOrEmptyString } from '../shared/utils';

export function parseModelId(modelId: string) {
  const [adapterId, ...modelNameParts] = modelId.split(':');
  const modelName = modelNameParts.join(':');

  if (isNilOrEmptyString(adapterId) || isNilOrEmptyString(modelName)) {
    throw new Error(
      `Invalid model identifier: ${modelId}. Expected format is "adapterId:modelName"`,
    );
  }

  return { adapterId, modelName };
}
