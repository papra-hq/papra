import { Buffer } from 'node:buffer';
import { createLogger } from '../../../shared/logger/logger';
import { createBackupDriverApiError } from '../../backups.errors';
import { defineBackupDriver } from '../drivers.models';
import { resolveWebdavRootUrl, type WebdavPreset } from './webdav.presets';

const logger = createLogger({ namespace: 'backups:drivers:webdav' });

export const WEBDAV_DRIVER_NAME = 'webdav';

type WebdavSettings = {
  baseUrl: string;
  preset?: WebdavPreset;
  remotePath?: string; // sub-folder under the WebDAV root, e.g. "Papra Backups"
};

function getRootUrl({ settings, credentials }: { settings: WebdavSettings; credentials: { username?: string } }): string {
  return resolveWebdavRootUrl({
    preset: settings.preset ?? 'generic',
    baseUrl: settings.baseUrl,
    username: credentials.username,
  });
}

function getAuthHeader({ username, password }: { username: string; password: string }): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function joinUrl(root: string, path: string): string {
  return `${root.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

// Minimal PROPFIND response parser. We only need the href + displayname of each
// entry, so a small regex pass is enough and avoids pulling in an XML parser dep.
function parsePropfindHrefs(xml: string): string[] {
  const matches = [...xml.matchAll(/<[^:>]*:?href[^>]*>([^<]+)<\/[^:>]*:?href>/gi)];
  return matches.map((m) => decodeURIComponent(m[1]!.trim()));
}

export const webdavBackupDriverFactory = defineBackupDriver(() => {
  async function request({
    settings,
    credentials,
    path,
    method,
    body,
    headers,
  }: {
    settings: WebdavSettings;
    credentials: { username?: string; password?: string };
    path: string;
    method: string;
    body?: Buffer | string;
    headers?: Record<string, string>;
  }): Promise<Response> {
    const { username, password } = credentials;
    if (!username || !password) {
      throw createBackupDriverApiError();
    }
    const root = getRootUrl({ settings, credentials });
    const url = joinUrl(root, path);

    const response = await fetch(url, {
      method,
      headers: { Authorization: getAuthHeader({ username, password }), ...(headers ?? {}) },
      body,
    });

    if (!response.ok && response.status !== 207 /* Multi-Status, used by PROPFIND */) {
      const text = await response.text().catch(() => '');
      logger.error({ url, method, status: response.status, text }, 'WebDAV request failed');
      throw createBackupDriverApiError();
    }
    return response;
  }

  return {
    name: WEBDAV_DRIVER_NAME,
    requiredCredentialFields: ['username', 'password'],

    async testConnection({ credentials, settings }) {
      const s = settings as unknown as WebdavSettings;
      await request({ settings: s, credentials, path: '', method: 'PROPFIND', headers: { Depth: '0' } });
      return { accountLabel: `${credentials.username}@${new URL(s.baseUrl).host}` };
    },

    async ensureRemoteFolder({ credentials, settings }) {
      const s = settings as unknown as WebdavSettings;
      const folderPath = s.remotePath ?? 'Papra Backups';
      // MKCOL is idempotent-ish for our purposes: if it already exists we get a
      // 405, which we treat as success. Any other failure is real.
      const root = getRootUrl({ settings: s, credentials });
      const url = joinUrl(root, folderPath);
      const response = await fetch(url, {
        method: 'MKCOL',
        headers: { Authorization: getAuthHeader({ username: credentials.username!, password: credentials.password! }) },
      });
      if (!response.ok && response.status !== 405) {
        throw createBackupDriverApiError();
      }
      return { folderRef: folderPath };
    },

    async uploadFile({ credentials, settings, folderRef, fileName, content }) {
      const s = settings as unknown as WebdavSettings;
      const path = `${folderRef}/${fileName}`;
      await request({ settings: s, credentials, path, method: 'PUT', body: content });
      return { remoteFileId: path, remoteFileName: fileName };
    },

    async downloadFile({ credentials, settings, remoteFileId }) {
      const s = settings as unknown as WebdavSettings;
      const response = await request({ settings: s, credentials, path: remoteFileId, method: 'GET' });
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },

    async deleteFile({ credentials, settings, remoteFileId }) {
      const s = settings as unknown as WebdavSettings;
      await request({ settings: s, credentials, path: remoteFileId, method: 'DELETE' });
    },

    async listFiles({ credentials, settings, folderRef }) {
      const s = settings as unknown as WebdavSettings;
      const response = await request({
        settings: s,
        credentials,
        path: folderRef,
        method: 'PROPFIND',
        headers: { Depth: '1' },
      });
      const xml = await response.text();
      const hrefs = parsePropfindHrefs(xml);
      const root = getRootUrl({ settings: s, credentials });
      const rootPath = new URL(root).pathname.replace(/\/+$/, '');

      return {
        files: hrefs
          .map((href) => new URL(href, root).pathname)
          .filter((p) => p.replace(/\/+$/, '') !== `${rootPath}/${folderRef}`.replace(/\/+$/, ''))
          .filter((p) => !p.endsWith('/'))
          .map((p) => ({
            remoteFileId: p.slice(rootPath.length).replace(/^\/+/, ''),
            name: decodeURIComponent(p.split('/').pop() ?? p),
          })),
      };
    },
  };
});
