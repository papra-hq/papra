import * as v from 'valibot';
import { createAdapterConfigSchema } from '../ai-adapters.factory.schemas';
import { OPENAI_COMPATIBLE_ADAPTER_NAME } from './openai-compatible.ai-adapters.constants';

export const openAiCompatibleAdapterConfigSchema = createAdapterConfigSchema(
  OPENAI_COMPATIBLE_ADAPTER_NAME,
  {
    baseUrl: v.string(),
    apiKey: v.string(),

    defaultHeaders: v.optional(v.record(v.string(), v.string())),
    defaultQuery: v.optional(v.record(v.string(), v.string())),
    organization: v.optional(v.string()),
    project: v.optional(v.string()),
  },
);

export type OpenAiCompatibleAdapterConfig = v.InferOutput<
  typeof openAiCompatibleAdapterConfigSchema
>;
