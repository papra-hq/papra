import type { UserMe } from './users.types';
import { apiClient } from '../shared/http/http-client';

export async function fetchCurrentUser() {
  const { user } = await apiClient<{ user: UserMe }>({
    path: '/api/users/me',
    method: 'GET',
  });

  return { user };
}
