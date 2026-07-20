import type { Config } from '../config/config.types';
import type { BackupDriver } from './drivers/drivers.models';
import { createLogger } from '../shared/logger/logger';
import { createBackupEncryptionService } from './backups.encryption.service';
import { createBackupsNotConfiguredError, createBackupUnknownDriverError } from './backups.errors';
import { createBackupPackagerService } from './backups.packager.service';
import { backupDriverFactories, type BackupDriverName } from './drivers/drivers.registry';

const logger = createLogger({ namespace: 'backups:services' });

export type BackupsServices = ReturnType<typeof createBackupsServices>;

export function createBackupsServices({ config }: { config: Config }) {
  // Encryption throws if BACKUPS_KEK is unset — that's intentional, it's the
  // single feature flag for the whole module. Callers (routes/usecases) should
  // guard with assertBackupsConfigured first for a clean 503 instead of a 500.
  const encryption = config.backups.kek ? createBackupEncryptionService({ config }) : undefined;
  const packager = createBackupPackagerService();

  function getDriver(driverName: string): BackupDriver {
    const factory = backupDriverFactories[driverName as BackupDriverName];
    if (!factory) {
      throw createBackupUnknownDriverError();
    }
    return factory({ config });
  }

  return {
    encryption,
    packager,
    getDriver,
    requireEncryption() {
      if (!encryption) {
        throw createBackupsNotConfiguredError();
      }
      return encryption;
    },
  };
}

export { logger as backupsLogger };
