import { createErrorFactory } from '../../shared/errors/errors';

export const createDocumentIdsNotFromOrganizationError = createErrorFactory({
  message: 'Some documents do not exist or do not belong to the organization.',
  code: 'documents.batch.documents_not_from_organization',
  statusCode: 400,
});
