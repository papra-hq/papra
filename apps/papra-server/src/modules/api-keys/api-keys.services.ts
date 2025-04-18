import { generateToken } from '../shared/random/random.services';
import { API_KEY_PREFIX } from './api-keys.constants';

export function generateApiToken() {
  const { token } = generateToken({ length: 64 });

  return `${API_KEY_PREFIX}${token}`;
}
