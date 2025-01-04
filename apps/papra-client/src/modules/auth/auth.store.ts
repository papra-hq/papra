import { safely } from '@corentinth/chisels';
import { makePersisted } from '@solid-primitives/storage';
import { createRoot, createSignal } from 'solid-js';
import { createHook, createWaitForHook } from '../shared/hooks/hooks';
import { isAccessTokenExpired } from './auth.models';
import { logout, requestAuthTokensRefresh } from './auth.services';

export const authStore = createRoot(() => {
  const [getAccessToken, setAccessTokenValue] = makePersisted(createSignal<string | null>(null), { name: 'papra_access_token', storage: localStorage });
  const onAuthChangeHook = createHook<{ isAuthenticated: boolean }>();
  const [getRedirectUrl, setRedirectUrl] = makePersisted(createSignal<string | null>(null), { name: 'papra_redirect_url', storage: localStorage });
  const [getIsRefreshTokenInProgress, setIsRefreshTokenInProgress] = createSignal(false);
  const [getMagicLinkRequestEmail, setMagicLinkRequestEmail] = createSignal<string | undefined>(undefined);

  const waitForRefreshTokenHook = createWaitForHook();

  const refreshToken = async () => {
    setIsRefreshTokenInProgress(true);

    const { accessToken } = await requestAuthTokensRefresh();

    setAccessTokenValue(accessToken);
    setIsRefreshTokenInProgress(false);
    waitForRefreshTokenHook.trigger();
    await onAuthChangeHook.trigger({ isAuthenticated: false });
  };

  const getIsAuthenticated = async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return false;
    }

    const isExpired = isAccessTokenExpired({ accessToken });

    if (isExpired && !getIsRefreshTokenInProgress()) {
      await safely(refreshToken());
    }

    return Boolean(getAccessToken());
  };

  const setAccessToken = async ({ accessToken }: { accessToken: string }) => {
    setAccessTokenValue(accessToken);
    await onAuthChangeHook.trigger({ isAuthenticated: true });
  };

  const clearAccessToken = async () => {
    setAccessTokenValue(null);
    await onAuthChangeHook.trigger({ isAuthenticated: false });
  };

  return {
    setAccessToken,
    getAccessToken,
    clearAccessToken,
    getIsAuthenticated,
    getRedirectUrl,
    setRedirectUrl,

    getIsRefreshTokenInProgress,
    setIsRefreshTokenInProgress,

    getMagicLinkRequestEmail,
    setMagicLinkRequestEmail,

    async waitForRefreshTokenToBeRefreshed() {
      if (!getIsRefreshTokenInProgress()) {
        return;
      }

      return waitForRefreshTokenHook.waitFor();
    },

    refreshToken,

    async logout() {
      await safely(logout());
      await clearAccessToken();

      window.location.href = '/login';
    },

    onAuthChange: onAuthChangeHook.on,
  };
});
