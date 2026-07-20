import { createErrorFactory } from '../shared/errors/errors';

export const createBackupsNotConfiguredError = createErrorFactory({
  message: 'Backups are not configured on this server. Set BACKUPS_KEK to enable the feature.',
  code: 'backups.not_configured',
  statusCode: 503,
});

export const createBackupDriverNotConfiguredError = createErrorFactory({
  message: 'This backup destination type is not configured on this server.',
  code: 'backups.driver_not_configured',
  statusCode: 503,
});

export const createBackupDestinationNotFoundError = createErrorFactory({
  message: 'Backup destination not found',
  code: 'backups.destination_not_found',
  statusCode: 404,
});

export const createBackupRunNotFoundError = createErrorFactory({
  message: 'Backup not found',
  code: 'backups.run_not_found',
  statusCode: 404,
});

export const createBackupAlreadyInProgressError = createErrorFactory({
  message: 'A backup is already in progress for this destination',
  code: 'backups.already_in_progress',
  statusCode: 409,
});

export const createBackupDriverApiError = createErrorFactory({
  message: 'The backup destination rejected the request. Check the connection details and try again.',
  code: 'backups.driver_api_error',
  statusCode: 502,
});

export const createBackupDriverOAuthError = createErrorFactory({
  message: 'Failed to complete the OAuth handshake with the backup destination.',
  code: 'backups.driver_oauth_error',
  statusCode: 502,
});

export const createBackupEncryptionError = createErrorFactory({
  message: 'Failed to encrypt or decrypt backup data. The KEK may have changed.',
  code: 'backups.encryption_error',
  statusCode: 500,
});

export const createBackupUnknownDriverError = createErrorFactory({
  message: 'Unknown backup destination driver',
  code: 'backups.unknown_driver',
  statusCode: 400,
});
