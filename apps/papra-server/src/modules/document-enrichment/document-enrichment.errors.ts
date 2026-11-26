import { createErrorFactory } from '../shared/errors/errors';

export const documentEnrichmentDisabledErrorDefinition = {
  message: 'The requested document enrichment capability is disabled.',
  code: 'document_enrichment.disabled',
  statusCode: 403,
} as const;

export const createDocumentEnrichmentDisabledError = createErrorFactory(
  documentEnrichmentDisabledErrorDefinition,
);

export const documentEnrichmentContentRequiredErrorDefinition = {
  message: 'Document enrichment requires extracted text.',
  code: 'document_enrichment.content_required',
  statusCode: 400,
} as const;

export const createDocumentEnrichmentContentRequiredError = createErrorFactory(
  documentEnrichmentContentRequiredErrorDefinition,
);
