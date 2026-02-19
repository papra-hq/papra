import { generateRandomString } from '../shared/random/random.services';
import { API_KEY_PREFIX, API_KEY_TOKEN_LENGTH } from './api-keys.constants';

export function generateApiToken() {
  const token = generateRandomString({ length: API_KEY_TOKEN_LENGTH });

  return { token: `${API_KEY_PREFIX}_${token}` };
}
