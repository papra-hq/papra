import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema } from '../config/config.schemas';

// The server-wide Key Encryption Key. Wraps every destination's refresh
// token / password and its per-destination backup encryption key. Without this
// set, the whole backups feature stays disabled (nothing is stored unencrypted).
// Generate with: openssl rand -hex 32
const kekSchema = v.optional(v.pipe(v.string(), v.length(64)));

export const backupsConfig = {
  kek: {
    doc: 'The 32-byte hex encryption key (KEK) used to wrap backup destination credentials and per-destination backup encryption keys. Generate with `openssl rand -hex 32`. Backups are disabled entirely when unset.',
    schema: kekSchema,
    default: undefined,
    env: 'BACKUPS_KEK',
  },
  isSchedulerEnabled: {
    doc: 'Whether the periodic backup scheduler is registered on startup. Manual "run now" backups still work regardless.',
    schema: booleanishSchema,
    default: true,
    env: 'BACKUPS_IS_SCHEDULER_ENABLED',
  },
  retentionDays: {
    doc: 'Number of days to keep backup runs before automatically deleting them. Set to 0 or undefined to disable automatic cleanup.',
    schema: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
    default: undefined,
    env: 'BACKUPS_RETENTION_DAYS',
  },
  googleDrive: {
    oauthClientId: {
      doc: 'Google OAuth client ID for the Google Drive backup destination. Leave unset to disable the Google Drive destination.',
      schema: v.optional(v.string()),
      default: undefined,
      env: 'BACKUPS_GOOGLE_OAUTH_CLIENT_ID',
    },
    oauthClientSecret: {
      doc: 'Google OAuth client secret for the Google Drive backup destination.',
      schema: v.optional(v.string()),
      default: undefined,
      env: 'BACKUPS_GOOGLE_OAUTH_CLIENT_SECRET',
    },
    oauthRedirectUri: {
      doc: 'OAuth redirect URI registered with the Google Cloud console. Defaults to `${baseUrl}/api/backups/google-drive/callback`.',
      schema: v.optional(v.string()),
      default: undefined,
      env: 'BACKUPS_GOOGLE_OAUTH_REDIRECT_URI',
    },
  },
} as const satisfies ConfigDefinition;

export const isGoogleDriveDestinationConfigured = (config: { oauthClientId?: string; oauthClientSecret?: string }) =>
  Boolean(config.oauthClientId && config.oauthClientSecret);
