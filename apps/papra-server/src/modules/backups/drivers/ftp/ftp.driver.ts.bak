import { Readable, Writable } from 'node:stream';
import { Client } from 'basic-ftp';
import { createLogger } from '../../../shared/logger/logger';
import { createBackupDriverApiError } from '../../backups.errors';
import { defineBackupDriver } from '../drivers.models';

const logger = createLogger({ namespace: 'backups:drivers:ftp' });

export const FTP_DRIVER_NAME = 'ftp';

type FtpSettings = {
  host: string;
  port?: number;
  secure?: boolean; // FTPS (explicit TLS). Plain FTP is a bad idea over the public internet.
  remotePath?: string;
};

// Defensive: strip a pasted "ftp://" prefix and split out a trailing ":port" so a
// messy Host field still connects instead of failing DNS resolution.
function parseHostAndPort({ host, port }: { host: string; port?: number }): { host: string; port: number } {
  let value = host.trim().replace(/^ftps?:\/\//i, '').replace(/\/+$/, '');
  let parsedPort = port;

  const portMatch = value.match(/^(.*):(\d+)$/);
  if (portMatch) {
    value = portMatch[1]!;
    parsedPort = Number(portMatch[2]);
  }

  return { host: value, port: parsedPort ?? 21 };
}

async function withClient<T>({
  credentials,
  settings,
  fn,
}: {
  credentials: { username?: string; password?: string };
  settings: FtpSettings;
  fn: (client: Client) => Promise<T>;
}): Promise<T> {
  const { username, password } = credentials;
  if (!username || !password) {
    throw createBackupDriverApiError();
  }

  const { host, port } = parseHostAndPort(settings);

  const client = new Client(30_000);
  try {
    await client.access({
      host,
      port,
      user: username,
      password,
      secure: settings.secure ?? true,
    });
    return await fn(client);
  } catch (error) {
    logger.error({ error, host: settings.host }, 'FTP operation failed');
    throw createBackupDriverApiError();
  } finally {
    client.close();
  }
}

export const ftpBackupDriverFactory = defineBackupDriver(() => {
  return {
    name: FTP_DRIVER_NAME,
    requiredCredentialFields: ['username', 'password'],

    async testConnection({ credentials, settings }) {
      const s = settings as unknown as FtpSettings;
      await withClient({ credentials, settings: s, fn: async (client) => client.pwd() });
      return { accountLabel: `${credentials.username}@${s.host}` };
    },

    async ensureRemoteFolder({ credentials, settings }) {
      const s = settings as unknown as FtpSettings;
      const folderPath = s.remotePath ?? 'papra-backups';
      await withClient({
        credentials,
        settings: s,
        fn: async (client) => {
          await client.ensureDir(folderPath);
        },
      });
      return { folderRef: folderPath };
    },

    async uploadFile({ credentials, settings, folderRef, fileName, content }) {
      const s = settings as unknown as FtpSettings;
      await withClient({
        credentials,
        settings: s,
        fn: async (client) => {
          await client.ensureDir(folderRef);
          await client.uploadFrom(Readable.from(content), fileName);
        },
      });
      return { remoteFileId: `${folderRef}/${fileName}`, remoteFileName: fileName };
    },

    async downloadFile({ credentials, settings, remoteFileId }) {
      const s = settings as unknown as FtpSettings;
      const chunks: Buffer[] = [];
      await withClient({
        credentials,
        settings: s,
        fn: async (client) => {
          await client.downloadTo(
            new Writable({
              write(chunk: Buffer, _enc: string, cb: () => void) {
                chunks.push(chunk);
                cb();
              },
            }),
            remoteFileId,
          );
        },
      });
      return Buffer.concat(chunks);
    },

    async deleteFile({ credentials, settings, remoteFileId }) {
      const s = settings as unknown as FtpSettings;
      await withClient({ credentials, settings: s, fn: async (client) => client.remove(remoteFileId) });
    },

    async listFiles({ credentials, settings, folderRef }) {
      const s = settings as unknown as FtpSettings;
      const entries = await withClient({
        credentials,
        settings: s,
        fn: async (client) => {
          await client.cd(folderRef);
          return client.list();
        },
      });
      return {
        files: entries
          .filter((e) => e.isFile)
          .map((e) => ({
            remoteFileId: `${folderRef}/${e.name}`,
            name: e.name,
            size: e.size,
            modifiedAt: e.modifiedAt,
          })),
      };
    },
  };
});
