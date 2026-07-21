import type { BackupDriverFactory } from './drivers.models';
import { FTP_DRIVER_NAME, ftpBackupDriverFactory } from './ftp/ftp.driver';
import {
  GOOGLE_DRIVE_DRIVER_NAME,
  googleDriveBackupDriverFactory,
} from './google-drive/google-drive.driver';
import { WEBDAV_DRIVER_NAME, webdavBackupDriverFactory } from './webdav/webdav.driver';
import { LOCAL_DRIVER_NAME, localBackupDriverFactory } from './local/local.driver';

export const BACKUP_DRIVER_NAMES = [
  GOOGLE_DRIVE_DRIVER_NAME,
  WEBDAV_DRIVER_NAME,
  FTP_DRIVER_NAME,
  LOCAL_DRIVER_NAME,
] as const;
export type BackupDriverName = (typeof BACKUP_DRIVER_NAMES)[number];

export const backupDriverFactories: Record<BackupDriverName, BackupDriverFactory> = {
  [GOOGLE_DRIVE_DRIVER_NAME]: googleDriveBackupDriverFactory,
  [WEBDAV_DRIVER_NAME]: webdavBackupDriverFactory,
  [FTP_DRIVER_NAME]: ftpBackupDriverFactory,
  [LOCAL_DRIVER_NAME]: localBackupDriverFactory,
};

export { FTP_DRIVER_NAME, GOOGLE_DRIVE_DRIVER_NAME, WEBDAV_DRIVER_NAME, LOCAL_DRIVER_NAME };
