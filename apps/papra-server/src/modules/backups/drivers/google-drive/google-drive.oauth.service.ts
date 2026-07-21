import type { Config } from '../../../config/config.types';
import {
  createBackupDriverNotConfiguredError,
  createBackupDriverOAuthError,
} from '../../backups.errors';
import {
  GOOGLE_DRIVE_AUTH_ENDPOINT,
  GOOGLE_DRIVE_OAUTH_TOKEN_ENDPOINT,
  GOOGLE_DRIVE_SCOPES,
  GOOGLE_DRIVE_USERINFO_ENDPOINT,
} from './google-drive.constants';

// Hand-rolled OAuth2 helper (no `googleapis` dep — we only need 3 endpoints).

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string; // only present on the initial exchange (prompt=consent)
  token_type: string;
  scope: string;
};

export function createGoogleDriveOAuthService({ config }: { config: Config }) {
  const { oauthClientId, oauthClientSecret, oauthRedirectUri } = config.backups.googleDrive;

  if (!oauthClientId || !oauthClientSecret) {
    throw createBackupDriverNotConfiguredError();
  }

  const getRedirectUri = (): string => {
    if (oauthRedirectUri) {
      return oauthRedirectUri;
    }
    const base = (config.appBaseUrl ?? config.server.baseUrl).replace(/\/+$/, '');
    return `${base}/api/backups/google-drive/callback`;
  };

  return {
    buildAuthorizationUrl({ state }: { state: string }): string {
      const params = new URLSearchParams({
        client_id: oauthClientId,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: GOOGLE_DRIVE_SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state,
      });
      return `${GOOGLE_DRIVE_AUTH_ENDPOINT}?${params.toString()}`;
    },

    async exchangeCodeForTokens({ code }: { code: string }): Promise<TokenResponse> {
      const response = await fetch(GOOGLE_DRIVE_OAUTH_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: oauthClientId,
          client_secret: oauthClientSecret,
          redirect_uri: getRedirectUri(),
          grant_type: 'authorization_code',
        }),
      });
      if (!response.ok) {
        throw createBackupDriverOAuthError();
      }
      return (await response.json()) as TokenResponse;
    },

    async refreshAccessToken({ refreshToken }: { refreshToken: string }): Promise<TokenResponse> {
      const response = await fetch(GOOGLE_DRIVE_OAUTH_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: oauthClientId,
          client_secret: oauthClientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      if (!response.ok) {
        throw createBackupDriverOAuthError();
      }
      return (await response.json()) as TokenResponse;
    },

    async fetchUserEmail({ accessToken }: { accessToken: string }): Promise<string | null> {
      const response = await fetch(GOOGLE_DRIVE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        return null;
      }
      const { email } = (await response.json()) as { email?: string };
      return email ?? null;
    },
  };
}

export type GoogleDriveOAuthService = ReturnType<typeof createGoogleDriveOAuthService>;
