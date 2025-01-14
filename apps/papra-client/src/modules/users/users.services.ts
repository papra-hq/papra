import type { UserMe } from './users.types';
import { apiClient } from '../shared/http/api-client';

export async function fetchCurrentUser() {
  const { user } = await apiClient<{ user: UserMe }>({
    path: '/api/users/me',
    method: 'GET',
  });

  return { user };
}

export async function updateUser({ name }: { name: string }) {
  const { user } = await apiClient<{ user: UserMe }>({
    path: '/api/users/me',
    method: 'PUT',
    body: { name },
  });

  return { user };
}
