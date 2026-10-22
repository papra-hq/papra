import * as v from 'valibot';
import { defineApiContract } from '../api/api.contracts';
import { errorResponseDefinition } from '../api/api.contracts.errors';
import { documentIdSchema } from '../documents/documents.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import {
  documentEnrichmentContentRequiredErrorDefinition,
  documentEnrichmentDisabledErrorDefinition,
} from './document-enrichment.errors';
import { enrichDocumentBodySchema } from './document-enrichment.schemas';

export const enrichDocumentContract = defineApiContract({
  operationId: 'enrichDocument',
  path: '/api/organizations/:organizationId/documents/:documentId/enrich',
  method: 'POST',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    }),
    body: {
      'application/json': enrichDocumentBodySchema,
    },
  },
  responses: {
    202: {
      description: 'Schedules enrichment using the existing extracted text without rerunning OCR.',
      content: {
        'application/json': {
          schema: v.object({ taskId: v.string() }),
        },
      },
    },
    ...errorResponseDefinition(documentEnrichmentDisabledErrorDefinition),
    ...errorResponseDefinition(documentEnrichmentContentRequiredErrorDefinition),
    ...errorResponseDefinition({
      message: 'Document not found.',
      code: 'document.not_found',
      statusCode: 404,
    }),
  },
});
