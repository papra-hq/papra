export const GOOGLE_DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
export const GOOGLE_DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
export const GOOGLE_DRIVE_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_DRIVE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_DRIVE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';

// `drive.file` only lets the app see files/folders IT created — Papra never sees
// the rest of the user's Drive.
export const GOOGLE_DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.email'];

export const GOOGLE_DRIVE_DEFAULT_FOLDER_NAME = 'Papra Backups';
export const GOOGLE_DRIVE_BACKUP_FILE_MIME_TYPE = 'application/octet-stream';
