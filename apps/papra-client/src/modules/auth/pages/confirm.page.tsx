import type { Component } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { createSignal, onMount } from 'solid-js';
import { authStore } from '../auth.store';

export const ConfirmPage: Component = () => {
  const [getError, setError] = createSignal<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  onMount(async () => {
    if (await authStore.getIsAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    const { hash } = location;

    // Parse the hash to get the access token (same format as query string)
    const hashParams = new URLSearchParams(hash.slice(1));

    const accessToken = hashParams.get('accessToken');

    if (!accessToken) {
      setError('Access token not found');
      return;
    }

    await authStore.setAccessToken({ accessToken });

    navigate('/', { replace: true });
  });

  return (
    <div class="flex items-center justify-center h-screen flex-col gap-4">
      <div class="i-tabler-loader-2 animate-spin text-4xl text-muted-foreground"></div>
      <div class="text-lg font-semibold">Authenticating...</div>

      {getError() && <div class="text-red-500">{getError()}</div>}
    </div>
  );
};
