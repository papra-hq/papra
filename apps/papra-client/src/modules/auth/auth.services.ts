import { config } from '../config/config';
import { apiClient } from '../shared/http/api-client';
import { httpClient } from '../shared/http/http-client';

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
  // Do not use apiClient here top prevent loops since requestAuthTokensRefresh might be called from apiClient
  const { accessToken } = await httpClient<{ accessToken: string }>({
    baseUrl: config.baseApiUrl,
    url: '/api/auth/refresh',
    method: 'POST',

    // Required to send the refresh token
    credentials: 'include',
  });

  return { accessToken };
}

export async function logout() {
  await apiClient({
    path: '/api/auth/logout',
    method: 'POST',
    credentials: 'include',
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
