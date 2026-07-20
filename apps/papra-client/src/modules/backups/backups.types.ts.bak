export type BackupDriverName = 'google_drive' | 'webdav' | 'ftp';

export type BackupSchedule = {
  isEnabled: boolean;
  days: number[]; // 0 (Sunday) - 6 (Saturday)
  hour: number | null;
  minute: number | null;
};

export type BackupDestination = {
  id: string;
  driver: BackupDriverName;
  displayName: string;
  settings: Record<string, unknown>;
  accountLabel: string | null;
  isEnabled: boolean;
  schedule: BackupSchedule;
  lastRunAt: Date | null;
  nextScheduledAt: Date | null;
  createdAt: Date;
};

export type BackupRunStatus = 'pending' | 'uploading' | 'succeeded' | 'failed';

export type BackupRun = {
  id: string;
  destinationId: string;
  trigger: 'manual' | 'scheduled';
  status: BackupRunStatus;
  remoteFileName: string | null;
  documentsCount: number | null;
  totalSizeBytes: number | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type BackupDriverInfo = {
  name: BackupDriverName;
  isConfigured: boolean;
};
