import * as v from 'valibot';
import { openAiCompatibleAdapterConfigSchema } from './openai-compatible/openai-compatible.ai-adapters.schemas';
import { ADAPTER_MODEL_SEPARATOR } from '../ai.constants';

export const aiModelAdapterConfigSchema = v.variant('adapter', [
  openAiCompatibleAdapterConfigSchema,
]);

export type AiModelAdapterConfig = v.InferOutput<typeof aiModelAdapterConfigSchema>;
export type AiModelAdapterListConfig = AiModelAdapterConfig[];

export const aiModelAdapterConfigListSchema = v.pipe(
  v.array(aiModelAdapterConfigSchema),
  v.check((list) => {
    const ids = new Set<string>();
    for (const config of list) {
      if (ids.has(config.id)) {
        return false;
      }
      ids.add(config.id);
    }
    return true;
  }, 'Duplicate AI model adapter IDs are not allowed. Make sure each adapter configuration has a unique "id" field.'),
);

export const adapterIdSchema = v.pipe(
  v.string(),
  v.check(
    (id) => !id.includes(ADAPTER_MODEL_SEPARATOR),
    `Adapter id cannot contain "${ADAPTER_MODEL_SEPARATOR}" as it is reserved for separating adapter id and model name in model identifiers.`,
  ),
);
