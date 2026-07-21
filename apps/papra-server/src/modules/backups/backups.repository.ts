import type { Database } from '../app/database/database.types';
import type {
  BackupDestination,
  BackupRun,
  BackupRunStatus,
  DbInsertableBackupDestination,
  DbInsertableBackupRun,
} from './backups.types';
import { injectArguments } from '@corentinth/chisels';
import { and, desc, eq, inArray, isNotNull, lte } from 'drizzle-orm';
import { omitUndefined } from '../shared/objects';
import { backupDestinationsTable, backupRunsTable } from './backups.table';

export type BackupsRepository = ReturnType<typeof createBackupsRepository>;

export function createBackupsRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      // Destinations
      createDestination,
      getDestinationById,
      listDestinationsByOrganizationId,
      updateDestination,
      deleteDestination,
      getDueScheduledDestinations,
      // Runs
      createRun,
      getRunById,
      listRunsByDestinationId,
      updateRunStatus,
      markStaleInProgressRunsAsFailed,
      getInProgressRunForDestination,
    },
    { db },
  );
}

// ----- Destinations -----

async function createDestination({
  destination,
  db,
}: {
  destination: DbInsertableBackupDestination;
  db: Database;
}): Promise<{ destination: BackupDestination }> {
  const [inserted] = await db.insert(backupDestinationsTable).values(destination).returning();
  return { destination: inserted! };
}

async function getDestinationById({
  destinationId,
  organizationId,
  db,
}: {
  destinationId: string;
  organizationId: string;
  db: Database;
}): Promise<{ destination: BackupDestination | undefined }> {
  const [destination] = await db
    .select()
    .from(backupDestinationsTable)
    .where(
      and(
        eq(backupDestinationsTable.id, destinationId),
        eq(backupDestinationsTable.organizationId, organizationId),
      ),
    )
    .limit(1);
  return { destination };
}

async function listDestinationsByOrganizationId({
  organizationId,
  db,
}: {
  organizationId: string;
  db: Database;
}): Promise<{ destinations: BackupDestination[] }> {
  const destinations = await db
    .select()
    .from(backupDestinationsTable)
    .where(eq(backupDestinationsTable.organizationId, organizationId))
    .orderBy(desc(backupDestinationsTable.createdAt));
  return { destinations };
}

async function updateDestination({
  destinationId,
  fields,
  db,
}: {
  destinationId: string;
  fields: Partial<
    Pick<
      BackupDestination,
      | 'displayName'
      | 'settingsJson'
      | 'encryptedCredentials'
      | 'accountLabel'
      | 'remoteFolderRef'
      | 'isScheduleEnabled'
      | 'scheduleDaysJson'
      | 'scheduleHour'
      | 'scheduleMinute'
      | 'lastRunAt'
      | 'nextScheduledAt'
      | 'isEnabled'
    >
  >;
  db: Database;
}): Promise<{ destination: BackupDestination }> {
  const [updated] = await db
    .update(backupDestinationsTable)
    .set({ ...omitUndefined(fields), updatedAt: new Date() })
    .where(eq(backupDestinationsTable.id, destinationId))
    .returning();
  return { destination: updated! };
}

async function deleteDestination({
  destinationId,
  organizationId,
  db,
}: {
  destinationId: string;
  organizationId: string;
  db: Database;
}): Promise<{ deleted: boolean }> {
  const result = await db
    .delete(backupDestinationsTable)
    .where(
      and(
        eq(backupDestinationsTable.id, destinationId),
        eq(backupDestinationsTable.organizationId, organizationId),
      ),
    )
    .returning({ id: backupDestinationsTable.id });
  return { deleted: result.length > 0 };
}

// Used by the scheduler tick: every destination with scheduling on whose
// nextScheduledAt has passed. The usecase layer recomputes nextScheduledAt after
// each run (whether it fires or not), so this is a plain timestamp comparison.
async function getDueScheduledDestinations({
  now,
  db,
}: {
  now: Date;
  db: Database;
}): Promise<{ destinations: BackupDestination[] }> {
  const destinations = await db
    .select()
    .from(backupDestinationsTable)
    .where(
      and(
        eq(backupDestinationsTable.isScheduleEnabled, true),
        eq(backupDestinationsTable.isEnabled, true),
        isNotNull(backupDestinationsTable.nextScheduledAt),
        lte(backupDestinationsTable.nextScheduledAt, now),
      ),
    );
  return { destinations };
}

// ----- Runs -----

async function createRun({
  run,
  db,
}: {
  run: DbInsertableBackupRun;
  db: Database;
}): Promise<{ run: BackupRun }> {
  const [inserted] = await db.insert(backupRunsTable).values(run).returning();
  return { run: inserted! };
}

async function getRunById({
  runId,
  organizationId,
  db,
}: {
  runId: string;
  organizationId: string;
  db: Database;
}): Promise<{ run: BackupRun | undefined }> {
  const [run] = await db
    .select()
    .from(backupRunsTable)
    .where(and(eq(backupRunsTable.id, runId), eq(backupRunsTable.organizationId, organizationId)))
    .limit(1);
  return { run };
}

async function listRunsByDestinationId({
  destinationId,
  limit = 20,
  db,
}: {
  destinationId: string;
  limit?: number;
  db: Database;
}): Promise<{ runs: BackupRun[] }> {
  const runs = await db
    .select()
    .from(backupRunsTable)
    .where(eq(backupRunsTable.destinationId, destinationId))
    .orderBy(desc(backupRunsTable.createdAt))
    .limit(limit);
  return { runs };
}

async function updateRunStatus({
  runId,
  status,
  fields = {},
  db,
}: {
  runId: string;
  status: BackupRunStatus;
  fields?: Partial<
    Pick<
      BackupRun,
      | 'remoteFileId'
      | 'remoteFileName'
      | 'documentsCount'
      | 'totalSizeBytes'
      | 'errorMessage'
      | 'completedAt'
    >
  >;
  db: Database;
}): Promise<void> {
  await db
    .update(backupRunsTable)
    .set({ status, ...omitUndefined(fields) })
    .where(eq(backupRunsTable.id, runId));
}

async function getInProgressRunForDestination({
  destinationId,
  db,
}: {
  destinationId: string;
  db: Database;
}): Promise<{ run: BackupRun | undefined }> {
  const [run] = await db
    .select()
    .from(backupRunsTable)
    .where(
      and(
        eq(backupRunsTable.destinationId, destinationId),
        inArray(backupRunsTable.status, ['pending', 'uploading']),
      ),
    )
    .limit(1);
  return { run };
}

// Marks runs stuck in pending/uploading past the stale threshold as failed.
// Fixes a real bug carried over from an earlier draft of this feature: the
// previous version filtered by organization only, with no status or age check,
// which would have marked every historical run as failed on every backup.
async function markStaleInProgressRunsAsFailed({
  destinationId,
  staleBefore,
  errorMessage,
  db,
}: {
  destinationId: string;
  staleBefore: Date;
  errorMessage: string;
  db: Database;
}): Promise<{ markedCount: number }> {
  const result = await db
    .update(backupRunsTable)
    .set({ status: 'failed', errorMessage, completedAt: new Date() })
    .where(
      and(
        eq(backupRunsTable.destinationId, destinationId),
        inArray(backupRunsTable.status, ['pending', 'uploading']),
        lte(backupRunsTable.createdAt, staleBefore),
      ),
    )
    .returning({ id: backupRunsTable.id });
  return { markedCount: result.length };
}
