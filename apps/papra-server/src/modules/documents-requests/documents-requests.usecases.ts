import type { DocumentsRequestAccessLevel } from './documents-requests.types';
import { generateDocumentsRequestToken } from './documents-requests.services';

export type DocumentsRequestsRepository = ReturnType<typeof import('./documents-requests.repository').createDocumentsRequestsRepository>;

export async function createDocumentsRequest({
  organizationId,
  createdBy,
  title,
  description,
  useLimit,
  expiresAt,
  accessLevel,
  isEnabled,
  documentsRequestsRepository,
  files,
  generateToken = generateDocumentsRequestToken,
}: {
  organizationId: string;
  createdBy: string | null;
  title: string;
  description?: string;
  useLimit?: number;
  expiresAt?: Date;
  accessLevel: DocumentsRequestAccessLevel;
  isEnabled?: boolean;
  documentsRequestsRepository: DocumentsRequestsRepository;
  files: {
    title: string;
    description?: string;
    allowedMimeTypes: string[];
    sizeLimit?: number;
    tags: string[];
  }[];
  generateToken?: () => { token: string };
}) {
  const { token } = generateToken();

  const { documentsRequest } = await documentsRequestsRepository.createDocumentsRequest({
    documentsRequest: {
      token,
      organizationId,
      createdBy,
      title,
      description,
      useLimit,
      expiresAt,
      accessLevel,
      isEnabled,
    },
    files,
  });

  return { documentsRequest };
}
