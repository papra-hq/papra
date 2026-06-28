import { createErrorFactory } from '../../shared/errors/errors';

export const createNoStrategyAbleToExtractTextError = createErrorFactory({
  code: 'content-extraction.noStrategyAbleToExtractText',
  message: 'No strategy was able to extract text from the document',
  statusCode: 500,
  isInternal: true,
});
