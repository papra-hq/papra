import * as v from 'valibot';
import { aiModelAdapterConfigListSchema } from './adapters/ai-adapters.schemas';

export const aiModelAdaptersEnvConfigSchema = v.pipe(
  v.string(),
  v.parseJson(),
  aiModelAdapterConfigListSchema,
);

export const aiModelsAdapterConfigSchema = v.union([
  aiModelAdapterConfigListSchema,
  aiModelAdaptersEnvConfigSchema,
]);

export const aiModelIdSchema = v.string();
