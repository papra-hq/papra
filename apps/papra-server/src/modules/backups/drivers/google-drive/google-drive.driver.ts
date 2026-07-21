import type { Config } from '../../../config/config.types';
import { createLogger } from '../../../shared/logger/logger';
import { createBackupDriverApiError } from '../../backups.errors';
import { defineBackupDriver } from '../drivers.models';
import {
  GOOGLE_DRIVE_BACKUP_FILE_MIME_TYPE,
  GOOGLE_DRIVE_DEFAULT_FOLDER_NAME,
  GOOGLE_DRIVE_FILES_ENDPOINT,
  GOOGLE_DRIVE_UPLOAD_ENDPOINT,
} from './google-drive.constants';
import { createGoogleDriveOAuthService } from './google-drive.oauth.service';

const logger = createLogger({ namespace: 'backups:drivers:google-drive' });

export const GOOGLE_DRIVE_DRIVER_NAME = 'google_drive';

type DriveFile = { id: string; name: string; mimeType: string; size?: string };

export const googleDriveBackupDriverFactory = defineBackupDriver(({ config }) => {
  const oauth = createGoogleDriveOAuthService({ config });

  // Access tokens are short-lived (~1h) and not worth persisting; we just refresh
  // from the stored refresh token on every operation. Simpler and avoids a second
  // encrypted-at-rest secret to manage.
  async function getAccessToken({ refreshToken }: { refreshToken: string }): Promise<string> {
    const { access_token } = await oauth.refreshAccessToken({ refreshToken });
    return access_token;
  }

  async function authorizedFetch({
    refreshToken,
    url,
    init,
  }: {
    refreshToken: string;
    url: string;
    init: RequestInit;
  }): Promise<Response> {
    const accessToken = await getAccessToken({ refreshToken });
    const response = await fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.text();
      logger.error({ url, status: response.status, body }, 'Google Drive API call failed');
      throw createBackupDriverApiError();
    }
    return response;
  }

  return {
    name: GOOGLE_DRIVE_DRIVER_NAME,
    requiredCredentialFields: ['refreshToken'],

    async testConnection({ credentials }) {
      const refreshToken = credentials.refreshToken;
      if (!refreshToken) {
        throw createBackupDriverApiError();
      }
      const accessToken = await getAccessToken({ refreshToken });
      const email = await oauth.fetchUserEmail({ accessToken });
      return { accountLabel: email ?? undefined };
    },

    async ensureRemoteFolder({ credentials, settings }) {
      const refreshToken = credentials.refreshToken!;
      const folderName =
        (settings.folderName as string | undefined) ?? GOOGLE_DRIVE_DEFAULT_FOLDER_NAME;

      const q = encodeURIComponent(
        `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`,
      );
      const findUrl = `${GOOGLE_DRIVE_FILES_ENDPOINT}?q=${q}&fields=files(id,name)`;
      const findResponse = await authorizedFetch({
        refreshToken,
        url: findUrl,
        init: { method: 'GET' },
      });
      const { files } = (await findResponse.json()) as { files: DriveFile[] };
      if (files[0]) {
        return { folderRef: files[0].id };
      }

      const createResponse = await authorizedFetch({
        refreshToken,
        url: GOOGLE_DRIVE_FILES_ENDPOINT,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        },
      });
      const created = (await createResponse.json()) as DriveFile;
      return { folderRef: created.id };
    },

    // Resumable upload: start a session, then PUT the bytes. Handles backups
    // larger than the 5MB multipart-upload ceiling.
    async uploadFile({ credentials, folderRef, fileName, mimeType, content }) {
      const refreshToken = credentials.refreshToken!;

      const sessionInitResponse = await authorizedFetch({
        refreshToken,
        url: `${GOOGLE_DRIVE_UPLOAD_ENDPOINT}?uploadType=resumable`,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ name: fileName, mimeType, parents: [folderRef] }),
        },
      });
      const sessionUri = sessionInitResponse.headers.get('Location');
      if (!sessionUri) {
        throw createBackupDriverApiError();
      }

      const accessToken = await getAccessToken({ refreshToken });
      const uploadResponse = await fetch(sessionUri, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType || GOOGLE_DRIVE_BACKUP_FILE_MIME_TYPE,
          'Authorization': `Bearer ${accessToken}`,
        },
        body: content,
      });
      if (!uploadResponse.ok) {
        const body = await uploadResponse.text();
        logger.error({ status: uploadResponse.status, body }, 'Google Drive upload failed');
        throw createBackupDriverApiError();
      }
      const uploaded = (await uploadResponse.json()) as DriveFile;
      return { remoteFileId: uploaded.id, remoteFileName: uploaded.name };
    },

    async downloadFile({ credentials, remoteFileId }) {
      const refreshToken = credentials.refreshToken!;
      const url = `${GOOGLE_DRIVE_FILES_ENDPOINT}/${remoteFileId}?alt=media`;
      const response = await authorizedFetch({ refreshToken, url, init: { method: 'GET' } });
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },

    async deleteFile({ credentials, remoteFileId }) {
      const refreshToken = credentials.refreshToken!;
      await authorizedFetch({
        refreshToken,
        url: `${GOOGLE_DRIVE_FILES_ENDPOINT}/${remoteFileId}`,
        init: { method: 'DELETE' },
      });
    },

    async listFiles({ credentials, folderRef }) {
      const refreshToken = credentials.refreshToken!;
      const q = encodeURIComponent(`'${folderRef}' in parents and trashed=false`);
      const fields = 'files(id,name,size,modifiedTime)';
      const url = `${GOOGLE_DRIVE_FILES_ENDPOINT}?q=${q}&fields=${fields}&pageSize=50&orderBy=createdTime desc`;
      const response = await authorizedFetch({ refreshToken, url, init: { method: 'GET' } });
      const { files } = (await response.json()) as {
        files: (DriveFile & { modifiedTime?: string })[];
      };
      return {
        files: files.map((f) => ({
          remoteFileId: f.id,
          name: f.name,
          size: f.size ? Number(f.size) : undefined,
          modifiedAt: f.modifiedTime ? new Date(f.modifiedTime) : undefined,
        })),
      };
    },
  };
});

export type { Config };
