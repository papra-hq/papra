import { generateToken } from '../shared/random/random.services';
import { DOCUMENTS_REQUESTS_TOKEN_LENGTH } from './documents-requests.constants';

export function generateDocumentsRequestToken() {
  const { token } = generateToken({ length: DOCUMENTS_REQUESTS_TOKEN_LENGTH });

  return { token };
}
