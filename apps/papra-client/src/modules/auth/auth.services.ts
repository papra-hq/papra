import { buildUrl } from '@corentinth/chisels';
import { config } from '../config/config';
import { apiClient } from '../shared/http/http-client';

export { login };

async function login({ email, password }: { email: string; password: string }) {
  const { accessToken } = await apiClient<{ accessToken: string }>({
    path: 'api/auth/login',
    method: 'POST',
    body: {
      email,
      password,
    },
  });

  return { accessToken };
}

export async function requestAuthTokensRefresh() {
  // Do not use apiClient here top prevent infinite loop

  const url = buildUrl({
    baseUrl: config.baseApiUrl,
    path: '/api/auth/refresh',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // set http only cookie
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to refresh tokens');
  }

  const { accessToken } = await response.json();

  return { accessToken };
}

export async function logout() {
  await apiClient({
    path: '/api/auth/logout',
    method: 'POST',
  });
}

export async function requestMagicLink({ email }: { email: string }) {
  await apiClient({
    path: '/api/auth/magic-link',
    method: 'POST',
    body: { email },
  });
}

export async function verifyMagicLink({ token }: { token: string }) {
  const { accessToken } = await apiClient<{ accessToken: string }>({
    path: '/api/auth/magic-link/verification',
    method: 'POST',
    body: { token },
  });

  return { accessToken };
}
