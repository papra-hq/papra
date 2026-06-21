import * as v from 'valibot';
import { openAiCompatibleAdapterConfigSchema } from './openai-compatible/openai-compatible.ai-adapters.schemas';

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
