import type { BackupDriver } from '../drivers.models';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from '../../../shared/logger/logger';

const logger = createLogger({ namespace: 'backups:drivers:local' });

export const LOCAL_DRIVER_NAME = 'local' as const;

export const localBackupDriverFactory = (): BackupDriver => ({
  name: LOCAL_DRIVER_NAME,
  requiredCredentialFields: [], // No credentials needed for local

  testConnection: async ({ settings }) => {
    const path = settings.path as string;
    try {
      await fs.access(path);
      return { accountLabel: `Local folder: ${path}` };
    } catch (error) {
      // Try to create the directory if it doesn't exist
      try {
        await fs.mkdir(path, { recursive: true });
        return { accountLabel: `Local folder: ${path} (created)` };
      } catch (mkdirError) {
        throw new Error(`Failed to access or create local folder: ${path}. ${(mkdirError as Error).message}`);
      }
    }
  },

  ensureRemoteFolder: async ({ settings }) => {
    const path = settings.path as string;
    await fs.mkdir(path, { recursive: true });
    return { folderRef: path };
  },

  uploadFile: async ({ settings, folderRef, fileName, content }) => {
    const path = join(folderRef, fileName);
    await fs.writeFile(path, content);
    return { remoteFileId: path, remoteFileName: fileName };
  },

  downloadFile: async ({ settings, remoteFileId }) => {
    const content = await fs.readFile(remoteFileId);
    return content;
  },

  deleteFile: async ({ settings, remoteFileId }) => {
    await fs.unlink(remoteFileId);
  },

  listFiles: async ({ settings, folderRef }) => {
    try {
      const files = await fs.readdir(folderRef);
      const result: { remoteFileId: string; name: string; size?: number; modifiedAt?: Date }[] = [];
      for (const file of files) {
        if (file.endsWith('.papra-backup')) {
          const filePath = join(folderRef, file);
          const stats = await fs.stat(filePath);
          result.push({
            remoteFileId: filePath,
            name: file,
            size: stats.size,
            modifiedAt: stats.mtime,
          });
        }
      }
      return { files: result };
    } catch (error) {
      logger.error({ error, folderRef }, 'Failed to list files in local folder');
      return { files: [] };
    }
  },
});
