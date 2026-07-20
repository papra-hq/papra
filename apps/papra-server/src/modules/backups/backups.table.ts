import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { backupDestinationIdPrefix, backupRunIdPrefix } from './backups.constants';

// One row per configured destination (an org can have several: e.g. Google Drive
// AND a WebDAV NAS). Holds the encrypted credentials + the per-destination backup
// encryption key, both wrapped with the server KEK.
export const backupDestinationsTable = sqliteTable(
  'backup_destinations',
  {
    ...createPrimaryKeyField({ prefix: backupDestinationIdPrefix }),
    ...createTimestampColumns(),

    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    // 'google_drive' | 'webdav' | 'ftp' — see drivers/drivers.registry.ts
    driver: text('driver').notNull(),
    displayName: text('display_name').notNull(),

    // Driver-specific, non-secret config (base URL, port, remote path, preset...),
    // stored as JSON so the settings page can show it without decrypting anything.
    settingsJson: text('settings_json').notNull().default('{}'),

    // Driver-specific secrets (refresh token, username/password...), JSON-encoded
    // then encrypted with the server KEK. Never sent to the client.
    encryptedCredentials: text('encrypted_credentials').notNull(),

    // Optional human-readable label surfaced by testConnection() (e.g. a Google
    // account email, or "alice@nextcloud.example.com").
    accountLabel: text('account_label'),

    // Per-destination symmetric key used to encrypt backup payloads before upload.
    // Wrapped with the server KEK.
    wrappedBackupKey: text('wrapped_backup_key').notNull(),
    backupKeyAlgorithm: text('backup_key_algorithm').notNull(),

    // Cached reference to the remote backup folder (Drive folder id, WebDAV/FTP
    // path...) so we don't re-resolve it on every run.
    remoteFolderRef: text('remote_folder_ref'),

    // ----- Scheduling (per-organization / per-destination, per your choice) -----
    isScheduleEnabled: integer('is_schedule_enabled', { mode: 'boolean' }).notNull().default(false),
    // JSON array of weekday ints, 0 (Sunday) to 6 (Saturday). Empty/absent = every day.
    scheduleDaysJson: text('schedule_days_json').notNull().default('[]'),
    scheduleHour: integer('schedule_hour'), // 0-23, server-local time
    scheduleMinute: integer('schedule_minute'), // 0-59
    lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
    nextScheduledAt: integer('next_scheduled_at', { mode: 'timestamp_ms' }),

    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    index('backup_destinations_organization_id_index').on(table.organizationId),
    index('backup_destinations_next_scheduled_at_index').on(table.nextScheduledAt),
  ],
);

// One row per backup run (manual or scheduled) against a given destination.
// Lifecycle: pending → uploading → succeeded | failed.
export const backupRunsTable = sqliteTable(
  'backup_runs',
  {
    ...createPrimaryKeyField({ prefix: backupRunIdPrefix }),
    ...createTimestampColumns(),

    destinationId: text('destination_id')
      .notNull()
      .references(() => backupDestinationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    trigger: text('trigger').notNull(), // 'manual' | 'scheduled'
    status: text('status').notNull(), // 'pending' | 'uploading' | 'succeeded' | 'failed'

    remoteFileId: text('remote_file_id'),
    remoteFileName: text('remote_file_name'),

    documentsCount: integer('documents_count'),
    totalSizeBytes: integer('total_size_bytes'),

    // JSON array of SHA256 hashes of documents included in this backup
    // Used for incremental backups to identify which documents are new/changed
    documentSha256HashesJson: text('document_sha256_hashes_json'),

    errorMessage: text('error_message'),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('backup_runs_destination_id_created_at_index').on(table.destinationId, table.createdAt),
    index('backup_runs_status_index').on(table.status),
    index('backup_runs_destination_id_status_index').on(table.destinationId, table.status),
  ],
);
