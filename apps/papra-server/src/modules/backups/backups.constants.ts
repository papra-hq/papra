import { createPrefixedIdRegex } from '../shared/random/ids.constants.models';

export const backupDestinationIdPrefix = 'bkdst';
export const backupDestinationIdRegex = createPrefixedIdRegex({ prefix: backupDestinationIdPrefix });

export const backupRunIdPrefix = 'bkrun';
export const backupRunIdRegex = createPrefixedIdRegex({ prefix: backupRunIdPrefix });

export const BACKUP_FILE_EXTENSION = '.papra-backup';
export const BACKUP_FILE_MIME_TYPE = 'application/octet-stream';

// Defensive cleanup: if the process dies mid-run, this stale row would otherwise
// block new runs forever.
export const STALE_IN_PROGRESS_RUN_TIMEOUT_MS = 24 * 60 * 60 * 1_000;

// How often the scheduler tick task wakes up to check whether any destination's
// schedule is due. 15 minutes gives ±15min precision on the chosen time, which is
// plenty for a backup job and keeps this cheap on constrained hardware (Termux etc).
export const SCHEDULER_TICK_CRON = '*/15 * * * *';
