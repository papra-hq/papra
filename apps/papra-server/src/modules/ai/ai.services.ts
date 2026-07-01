import type { Config } from '../config/config.types';
import { resolveTextAdapter } from './adapters/ai-adapters.usecases';
import { chat as tanstackChat } from '@tanstack/ai';
import { toStandardJsonSchema } from '@valibot/to-json-schema';
import type { GenericSchema, InferOutput } from 'valibot';

export type AiServices = ReturnType<typeof createAiServices>;

export function createAiServices({ config }: { config: Config }) {
  // Not using injectArguments here: it relies on Parameters/ReturnType, which collapse the
  // `Schema` type parameter to its constraint, making the result `unknown`. A thin generic
  // wrapper preserves inference so callers get back InferOutput<Schema>.
  return {
    generateStructuredData: async <Schema extends GenericSchema>(args: {
      modelId: string;
      schema: Schema;
      userPrompt: string;
      systemPrompt?: string;
    }): Promise<InferOutput<Schema>> => generateStructuredData({ ...args, config }),
  };
}

async function generateStructuredData<Schema extends GenericSchema>({
  modelId,
  schema,
  userPrompt,
  systemPrompt,
  config,
}: {
  modelId: string;
  schema: Schema;
  userPrompt: string;
  systemPrompt?: string;
  config: Config;
}): Promise<InferOutput<Schema>> {
  const adapter = resolveTextAdapter({
    modelId,
    config,
  });

  const jsonSchema = toStandardJsonSchema(schema);

  const data = await tanstackChat({
    adapter,
    messages: userPrompt ? [{ role: 'user', content: userPrompt }] : undefined,
    outputSchema: jsonSchema,
    systemPrompts: systemPrompt ? [systemPrompt] : undefined,
  });

  return data;
}
