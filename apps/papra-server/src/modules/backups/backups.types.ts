import type { Expand } from '@corentinth/chisels';
import type { BackupDriverName } from './drivers/drivers.registry';
import type { backupDestinationsTable, backupRunsTable } from './backups.table';

export type BackupDestination = Expand<typeof backupDestinationsTable.$inferSelect>;
export type DbInsertableBackupDestination = Expand<typeof backupDestinationsTable.$inferInsert>;

export type BackupRun = Expand<typeof backupRunsTable.$inferSelect>;
export type DbInsertableBackupRun = Expand<typeof backupRunsTable.$inferInsert>;

// Public-facing shape: never includes encryptedCredentials or wrappedBackupKey.
export type PublicBackupDestination = Omit<BackupDestination, 'encryptedCredentials' | 'wrappedBackupKey'> & {
  driver: BackupDriverName;
};

export type BackupRunStatus = 'pending' | 'uploading' | 'succeeded' | 'failed';
export type BackupRunTrigger = 'manual' | 'scheduled';

export type BackupSchedule = {
  isEnabled: boolean;
  days: number[]; // 0 (Sunday) - 6 (Saturday), empty = every day
  hour: number | null;
  minute: number | null;
};
