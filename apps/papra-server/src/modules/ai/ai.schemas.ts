import * as v from 'valibot';
import { isValidModelId } from './ai.models';

export const aiModelIdSchema = v.pipe(
  v.string(),
  v.check(
    isValidModelId,
    'Invalid model identifier. Expected format is "adapterId://modelName", e.g. "openai://gpt-4"',
  ),
);
