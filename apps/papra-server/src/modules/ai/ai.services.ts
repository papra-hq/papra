import type { Logger } from '@crowlog/logger';
import type { Config } from '../config/config.types';
import { resolveTextAdapter } from './adapters/ai-adapters.usecases';
import { EventType, chat as tanstackChat } from '@tanstack/ai';
import type { ChatMiddleware } from '@tanstack/ai';
import { toStandardJsonSchema } from '@valibot/to-json-schema';
import type { GenericSchema, InferOutput } from 'valibot';
import { createLogger } from '../shared/logger/logger';

export type AiServices = ReturnType<typeof createAiServices>;

export function createAiServices({
  config,
  logger = createLogger({ namespace: 'ai.services' }),
}: {
  config: Config;
  logger?: Logger;
}) {
  // Not using injectArguments here: it relies on Parameters/ReturnType, which collapse the
  // `Schema` type parameter to its constraint, making the result `unknown`. A thin generic
  // wrapper preserves inference so callers get back InferOutput<Schema>.
  return {
    generateStructuredData: async <Schema extends GenericSchema>(args: {
      modelId: string;
      schema: Schema;
      userPrompt: string;
      systemPrompt?: string;
    }): Promise<InferOutput<Schema>> => generateStructuredData({ ...args, config, logger }),
  };
}

async function generateStructuredData<Schema extends GenericSchema>({
  modelId,
  schema,
  userPrompt,
  systemPrompt,
  config,
  logger,
}: {
  modelId: string;
  schema: Schema;
  userPrompt: string;
  systemPrompt?: string;
  config: Config;
  logger: Logger;
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
    middleware: [createLogMiddleware({ logger, context: { modelId } })],
  });

  return data;
}

function createLogMiddleware({
  logger,
  context,
}: {
  logger: Logger;
  context: Record<string, unknown>;
}): ChatMiddleware {
  return {
    name: 'log',
    onChunk: (_ctx, chunk) => {
      if (chunk.type === EventType.RUN_ERROR) {
        logger.error(
          {
            error: {
              message: chunk.message,
              code: chunk.code,
            },
            ...context,
          },
          'Error generating structured data',
        );
      }
    },
  };
}
