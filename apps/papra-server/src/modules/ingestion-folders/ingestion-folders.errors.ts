import { createError } from '../shared/errors/errors';

export function createInvalidPostProcessingStrategyError({ strategy }: { strategy: string }) {
  return createError({
    code: 'ingestion-folder.invalid-post-processing-strategy',
    message: `The post-processing strategy "${strategy}" is invalid`,
    statusCode: 501,
    isInternal: true,
  });
}
