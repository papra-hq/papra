// Every backup destination (Google Drive, WebDAV, FTP, ...) implements this same
// shape. The rest of the backups module (encryption, packaging, scheduling,
// history, restore) is written once against this interface and never needs to
// know which destination it's talking to.
//
// `credentials` is a plain object of driver-specific secrets (e.g. `{ refreshToken }`
// for Google Drive, `{ username, password }` for WebDAV/FTP). It is only ever
// decrypted in memory for the duration of a single operation — see
// backups.encryption.service.ts for how it's stored at rest.
//
// `settings` is driver-specific *non-secret* config (base URL, port, remote path
// prefix, etc.) stored as-is (not encrypted) on the destination row, so the
// settings page can display it without needing to decrypt anything.

export type BackupDriverCredentials = Record<string, string>;
export type BackupDriverSettings = Record<string, unknown>;

export type BackupRemoteFile = {
  remoteFileId: string;
  name: string;
  size?: number;
  modifiedAt?: Date;
};

export type BackupDriver = {
  name: string;

  // Human-facing label for the fields this driver needs, used by the client to
  // render the right form. Kept minimal on purpose — the client also has its
  // own hardcoded forms per driver, this is just for validation error messages.
  requiredCredentialFields: string[];

  // Verify the credentials/settings actually work before we save a destination.
  // Returns an optional account label to display (e.g. the Google account email,
  // or "connected to nextcloud.example.com").
  testConnection: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
  }) => Promise<{ accountLabel?: string }>;

  // Find or create the folder/directory backups should be written to. Returns an
  // opaque reference the driver can use later (a Drive folder id, a WebDAV/FTP
  // path — whatever makes sense for that driver). Cached by the caller so this
  // only runs once per destination.
  ensureRemoteFolder: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
  }) => Promise<{ folderRef: string }>;

  uploadFile: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
    folderRef: string;
    fileName: string;
    mimeType: string;
    content: Buffer;
  }) => Promise<{ remoteFileId: string; remoteFileName: string }>;

  downloadFile: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
    remoteFileId: string;
  }) => Promise<Buffer>;

  deleteFile: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
    remoteFileId: string;
  }) => Promise<void>;

  listFiles: (args: {
    credentials: BackupDriverCredentials;
    settings: BackupDriverSettings;
    folderRef: string;
  }) => Promise<{ files: BackupRemoteFile[] }>;
};

export type BackupDriverFactory = (args: { config: import('../../config/config.types').Config }) => BackupDriver;

export function defineBackupDriver<T extends BackupDriverFactory>(factory: T) {
  return factory;
}
