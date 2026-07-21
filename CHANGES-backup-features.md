# Backup System Improvements & Bug Fixes

**Date:** 2025-07-20  
**Status:** Implemented, needs migration and server restart  
**Author:** Mistral Vibe (via user collaboration)

---

## Summary

This document logs all changes made to the Papra backup system, including **bug fixes** and **three major feature improvements**: Incremental Backups, Backup Verification, and Retention Policies.

**Note:** Additional fix applied after initial implementation - see [Google Drive OAuth Redirect Fix](#google-drive-oauth-redirect-fix) below.

---

## Table of Contents

1. [Bug Fixes](#bug-fixes)
2. [Incremental Backups](#1-incremental-backups)
3. [Backup Verification](#2-backup-verification)
4. [Retention Policies](#3-retention-policies)
5. [Files Changed](#files-changed)
6. [Migration & Deployment](#migration--deployment)
7. [Testing](#testing)

---

## Bug Fixes

### 1. Backup Status Not Updating (PRIMARY BUG)

**Problem:** When clicking "Run Now" for a backup, the UI showed "pending" status but did not automatically update to show the final result (succeeded/failed). Users had to manually refresh the page or navigate away and back.

**Root Cause:** The `handleRunNow` function called `invalidateRuns()` which marks the TanStack Query as stale but doesn't immediately trigger a refetch. The backup operation is asynchronous (fire-and-forget on the server), so status transitions from `pending` → `uploading` → `succeeded`/`failed` happen after the initial API response, but the UI wasn't polling to check for updates.

**Solution:** Implemented automatic polling mechanism:

- Immediately refetch after triggering backup to show pending state
- Poll every 2 seconds to check for status updates
- Automatically stop polling when all backups complete
- 5-minute timeout as safety fallback
- Button disables while backup is running or polling is active

**Files:**

- `apps/papra-client/src/modules/backups/pages/backups.page.tsx`

---

### 2. Local Backup Driver Not Registered

**Problem:** Server crashed with `Unknown backup destination driver` error when trying to run backups on destinations using the `local` driver.

**Root Cause:** The `local` backup driver existed in `apps/papra-server/src/modules/backups/drivers/local/local.driver.ts` but was not registered in the driver registry.

**Solution:** Added local driver to the registry and type system.

**Files:**

- `apps/papra-server/src/modules/backups/drivers/drivers.registry.ts`
- `apps/papra-client/src/modules/backups/backups.types.ts`

---

### 3. Google Drive OAuth Redirect Fix

**Problem:** After successful Google Drive OAuth authorization, users were redirected to a 404 page (`/organizations/{orgId}/backups?connected={destinationId}`) even though the destination was created successfully.

**Root Cause:** The client application running on port 3001 doesn't have a route that handles the `?connected={destinationId}` query parameter, causing a 404 error on redirect. However, the server-side OAuth flow completed successfully and the destination was created.

**Solution:** Changed the redirect URL to go to the home page (`/`) instead of the backups page with query parameters. This prevents the 404 while still maintaining a clean OAuth flow.

**Files:**

- `apps/papra-server/src/modules/backups/drivers/google-drive/google-drive.routes.ts`

---

## 1. Incremental Backups

### Overview

Only backs up new or changed documents instead of all documents every time.

### Motivation

- Reduces backup size and time significantly
- Reduces bandwidth usage
- Reduces storage costs
- Especially beneficial for large document libraries

### Implementation

#### Database Schema

- Added `documentSha256HashesJson` column to `backup_runs` table
- Type: `TEXT` (JSON array of strings)
- Stores SHA256 hashes of all documents included in that backup run
- Nullable for backward compatibility with existing runs

#### Logic Flow

```
1. Get last successful backup run for this destination
   ↓
2. Parse previous hashes from documentSha256HashesJson
   ↓
3. Fetch all organization documents
   ↓
4. Filter: EXCLUDE documents whose hash is in previousHashes set
   ↓
5. Build backup with only new/changed documents
   ↓
6. On success, store current document hashes in new run record
```

#### Key Design Decisions

| Decision                 | Rationale                                                            |
| ------------------------ | -------------------------------------------------------------------- |
| Use SHA256 hashes        | Already computed and stored for each document (`originalSha256Hash`) |
| Store hashes in DB       | Transactionally consistent, survives restarts, queryable             |
| JSON array format        | Simple, human-readable, easy to serialize/deserialize                |
| Filter at document fetch | Efficient: only fetch documents we need to back up                   |
| First backup = full      | No previous hashes → include all documents                           |

#### Edge Cases Handled

| Scenario                           | Behavior                                         |
| ---------------------------------- | ------------------------------------------------ |
| First backup for destination       | No previous hashes → full backup                 |
| Previous backup failed             | Only succeeded runs are considered               |
| Document deleted since last backup | Not in document list → not backed up (correct)   |
| Document unchanged                 | Hash matches → excluded from backup              |
| Document updated                   | New hash → included in backup                    |
| Migration not run yet              | Column is nullable → gracefully handles old runs |

### Files Changed

- `apps/papra-server/src/migrations/list/0029-incremental-backups.migration.ts` (NEW)
- `apps/papra-server/src/migrations/migrations.registry.ts`
- `apps/papra-server/src/modules/backups/backups.table.ts`
- `apps/papra-server/src/modules/backups/backups.repository.ts`
- `apps/papra-server/src/modules/backups/backups.usecases.ts`

---

## 2. Backup Verification

### Overview

Validates backup integrity by re-computing document hashes and comparing against stored hashes.

### Motivation

- Detect corrupted backup files (bitrot, truncated downloads, storage errors)
- Verify before restore to avoid restoring corrupted data
- Provide confidence that backups are intact

### Implementation

#### API Endpoint

```
POST /api/organizations/{orgId}/backups/destinations/{destId}/runs/{runId}/verify
```

#### Logic Flow

```
1. Fetch run and destination from database
   ↓
2. Download backup file from remote destination
   ↓
3. Decrypt envelope (unpackBackupEnvelope + decryptPayload)
   ↓
4. Decompress and extract tar archive (unpack)
   ↓
5. For each document in manifest:
   a. Find matching file in archive (by doc.id prefix)
   b. Re-compute SHA256 hash of file content
   c. Compare with manifest.originalSha256Hash
   ↓
6. Return verification report
```

#### Response Format

```typescript
{
  valid: boolean;              // Overall result
  totalDocuments: number;     // Documents in manifest
  validDocuments: number;     // Documents that passed verification
  invalidDocuments: number;   // Documents that failed
  errors: string[];           // Specific error messages
}
```

#### Key Design Decisions

| Decision                  | Rationale                                            |
| ------------------------- | ---------------------------------------------------- |
| Per-document verification | Granular: know exactly which documents are corrupted |
| Use manifest hashes       | Already part of backup, no additional metadata       |
| Re-compute from archive   | Self-contained: doesn't need original documents      |
| SHA256                    | Same algorithm as original hash computation          |
| Only for succeeded runs   | Failed/pending runs can't be verified reliably       |

#### Bug Fix in Implementation

**Initial Bug:** Used `Object.keys(unpackedFiles)` but `unpackedFiles` is a `Map<string, Buffer>`, not a plain object. `Object.keys()` on a Map returns empty array.

**Fix:** Changed to `Array.from(unpackedFiles.keys())` to correctly iterate Map keys.

### Files Changed

- `apps/papra-server/src/modules/backups/backups.packager.service.ts`
- `apps/papra-server/src/modules/backups/backups.usecases.ts`
- `apps/papra-server/src/modules/backups/backups.routes.ts`
- `apps/papra-client/src/modules/backups/backups.services.ts`
- `apps/papra-client/src/modules/backups/pages/backups.page.tsx`

---

## 3. Retention Policies

### Overview

Automatically delete old backup runs after a configurable number of days.

### Motivation

- Prevent unlimited storage growth
- Clean up old backups automatically
- Configurable per-installation

### Implementation

#### Configuration

New environment variable:

```
BACKUPS_RETENTION_DAYS=30  # Keep backups for 30 days
```

- Set to `0` or `undefined` to disable
- Only affects succeeded backup runs
- Default: disabled (undefined)

#### Scheduled Task

- **Task Name:** `backups.retention-cleanup`
- **Schedule:** Daily at 2 AM (cron: `0 2 * * *`)
- **Trigger:** Server startup (if enabled)

#### Logic Flow

```
1. Check if enabled (config.backups.retentionDays > 0)
   ↓
2. Calculate cutoff date:
   cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
   ↓
3. Query succeeded runs older than cutoff:
   SELECT FROM backup_runs
   WHERE status = 'succeeded'
     AND created_at < cutoff
   ↓
4. For each run:
   a. Try to delete remote file (best effort)
   b. Delete local database record
   c. Log success/failure
```

#### Key Design Decisions

| Decision              | Rationale                                        |
| --------------------- | ------------------------------------------------ |
| Environment variable  | Per-server configuration, easy to change         |
| Daily schedule        | Regular cleanup without excessive frequency      |
| Only succeeded runs   | Failed runs might need investigation             |
| Remote deletion first | Clean up storage before DB (best effort)         |
| Graceful failure      | If remote deletion fails, still delete DB record |
| Disabled by default   | Backward compatible, opt-in feature              |

### Files Changed

- `apps/papra-server/src/modules/backups/backups.config.ts`
- `apps/papra-server/src/modules/backups/tasks/backup-retention-cleanup.task.ts` (NEW)
- `apps/papra-server/src/modules/tasks/tasks.definitions.ts`

---

## Files Changed

### New Files (4)

| File                                                                           | Purpose                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------ |
| `apps/papra-server/src/migrations/list/0029-incremental-backups.migration.ts`  | Database migration for incremental backups |
| `apps/papra-server/src/modules/backups/tasks/backup-retention-cleanup.task.ts` | Scheduled task for retention cleanup       |

### Modified Files (14)

| File                                                                                | Changes                                                               |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/papra-server/src/migrations/migrations.registry.ts`                           | Registered new migration                                              |
| `apps/papra-server/src/modules/backups/backups.config.ts`                           | Added `retentionDays` config                                          |
| `apps/papra-server/src/modules/backups/backups.table.ts`                            | Added `documentSha256HashesJson` column                               |
| `apps/papra-server/src/modules/backups/backups.repository.ts`                       | Added `getLastSuccessfulRunForDestination`, updated `updateRunStatus` |
| `apps/papra-server/src/modules/backups/backups.usecases.ts`                         | Incremental backups logic, verification usecase, store hashes         |
| `apps/papra-server/src/modules/backups/backups.routes.ts`                           | Added verification route                                              |
| `apps/papra-server/src/modules/backups/backups.packager.service.ts`                 | Added `computeHash` method                                            |
| `apps/papra-server/src/modules/backups/drivers/drivers.registry.ts`                 | Registered local driver                                               |
| `apps/papra-server/src/modules/backups/drivers/google-drive/google-drive.routes.ts` | Fixed OAuth redirect to home page                                     |
| `apps/papra-server/src/modules/tasks/tasks.definitions.ts`                          | Registered retention task                                             |
| `apps/papra-client/src/modules/backups/backups.types.ts`                            | Added `'local'` to `BackupDriverName`                                 |
| `apps/papra-client/src/modules/backups/backups.services.ts`                         | Added `verifyBackupRun` service                                       |
| `apps/papra-client/src/modules/backups/pages/backups.page.tsx`                      | Polling, Verify button, UI updates                                    |

**Total:** 18 files changed (2 new, 16 modified), ~470 lines added/modified

---

## Migration & Deployment

### Step 1: Run Database Migration

```bash
# From project root
pnpm --filter papra-server migrate:up

# Or from server directory
cd apps/papra-server && pnpm migrate:up
```

This applies migration `0029-incremental-backups.migration.ts` which adds the `documentSha256HashesJson` column to the `backup_runs` table.

### Step 2: Configure (Optional)

```bash
# In your .env file
export BACKUPS_RETENTION_DAYS=30  # Enable retention: delete backups after 30 days
export BACKUPS_IS_SCHEDULER_ENABLED=true  # Make sure scheduler is enabled
```

### Step 3: Restart Server

```bash
# Stop and restart your Papra server
pnpm --filter papra-server restart
# or
pnpm dev
```

### Step 4: Verify

1. Go to Settings → Backups
2. Click "Run Now" for a destination
3. Observe: status automatically updates from pending → uploading → succeeded
4. Click "Verify" on a succeeded backup run
5. Observe: verification result toast appears

---

## Testing

### Manual Testing Checklist

#### Incremental Backups

- [ ] First backup for a destination includes all documents
- [ ] Second backup (no changes) includes 0 documents
- [ ] Add a new document → next backup includes only that document
- [ ] Modify a document → next backup includes only that document
- [ ] Delete a document → next backup does not include it
- [ ] Check server logs for `isIncremental: true/false`

#### Backup Verification

- [ ] Verify button only appears for succeeded runs
- [ ] Verification succeeds for valid backups
- [ ] Verification shows correct document counts
- [ ] Verification handles missing remote files gracefully
- [ ] Verify button disables during verification

#### Retention Policies

- [ ] With `BACKUPS_RETENTION_DAYS=1`, old backups deleted next day at 2 AM
- [ ] With `BACKUPS_RETENTION_DAYS=undefined`, no backups deleted
- [ ] Failed/pending backups are NOT deleted
- [ ] Check server logs for cleanup results

#### Bug Fixes

- [ ] "Run Now" button disables while running
- [ ] Status updates automatically without page refresh
- [ ] Local driver backups work without server crash

---

## Rollback Plan

If issues arise, you can rollback:

### Option 1: Revert Code Changes

```bash
git checkout HEAD -- .
```

### Option 2: Rollback Migration

```bash
pnpm --filter papra-server migrate:down
```

This will revert the database migration but keep the code changes (which will fail without the DB column). For full rollback, use Option 1.

---

## Known Issues & Limitations

1. **Incremental Backups:**
   - If a document's `originalSha256Hash` changes outside the normal upload flow, it will be backed up again
   - Renaming a document does NOT trigger a new backup (hash is content-based, not name-based)
   - Only works within the same destination; switching destinations starts fresh

2. **Backup Verification:**
   - Requires network access to download backup from remote destination
   - Large backups may take time to download and verify
   - Only verifies documents that were included in the backup (for incremental backups, only verifies incremental set)

3. **Retention Policies:**
   - Only deletes succeeded runs; failed/pending runs accumulate indefinitely
   - Remote file deletion is best-effort; if it fails, local record is still deleted
   - No dry-run mode to preview what would be deleted

4. **Local Driver:**
   - Was already in codebase but unregistered; now properly integrated

---

## Future Improvements

These were suggested but deferred:

1. **Notifications** (deferred per user request)
   - Email/Slack alerts for failed backups
   - Success notifications optional
   - Configurable notification channels

2. **Additional Enhancements**
   - Compression level configuration
   - Parallel document upload for faster backups
   - Progress tracking for large backups
   - Backup size estimates before running
   - Cross-destination backup copy

---

## References

- Backup System Architecture: `apps/papra-server/src/modules/backups/`
- Migration System: `apps/papra-server/src/migrations/`
- Task Scheduler: `apps/papra-server/src/modules/tasks/`
- Client Backup UI: `apps/papra-client/src/modules/backups/`

---

## Docker Setup

Added comprehensive Docker support for easy deployment on all platforms including **aarch64 (ARM64)** for Termux/Android devices.

### New Files Created

1. **`Dockerfile`** - Multi-stage build with:
   - Platform-aware building (supports linux/amd64 and linux/arm64)
   - Proper dependency installation for Alpine Linux
   - Non-root user (nodejs:1001) for security
   - Health check endpoint on `/api/health`
   - Automatic migrations on startup
   - Volume setup for persistent data (data, local-documents, ingestion)

2. **`docker-compose.yml`** - Easy deployment with:
   - Pre-configured volumes for persistent storage
   - Environment variable mapping from `.env` file
   - Health checks
   - Restart policies

3. **`.env.template`** - Complete environment variable reference with:
   - All required variables documented
   - Optional variables with defaults
   - Generation commands for secrets (openssl rand -hex)
   - Sectioned organization (Auth, Database, Backups, Server, etc.)

4. **`DOCKER-README.md`** - Comprehensive documentation covering:
   - Quick start guide
   - Architecture-specific builds (aarch64, amd64)
   - Termux/Android setup with uDocker
   - Environment variable reference
   - Volume configuration
   - Health checks
   - Troubleshooting guide
   - Security considerations
   - Reverse proxy setup
   - Update procedures
   - Multi-architecture image builds
   - Backup and restore procedures

5. **`scripts/build-docker.sh`** - Build automation script with:
   - Color-coded output
   - Platform detection
   - Buildx support for cross-platform builds
   - Optional push to registry
   - Usage instructions

### Key Features

- **Multi-Architecture Support**: Builds for both amd64 and aarch64
- **Cross-Compilation**: Can build aarch64 images on x86_64 hosts using Docker Buildx
- **Secure by Default**: Runs as non-root user, .env excluded from image
- **Persistent Storage**: Volumes for database, documents, and ingestion
- **Health Monitoring**: Built-in health checks
- **Termux Compatible**: Specific instructions for Android/Termux with uDocker

### Usage

```bash
# Build for current architecture
docker build --platform linux/$(uname -m) -t papra-server .

# Or use docker-compose
docker-compose build
docker-compose up -d

# For Termux on Android
docker build --platform linux/arm64 -t papra-server .
```

See `DOCKER-README.md` for complete documentation.

---

## Migration & Deployment Notes

After implementing all backup features, remember to:

1. Run the migration: `pnpm --filter papra-server migrate:up`
2. Restart the server
3. Test all features including:
   - Backup status auto-updates (no page refresh needed)
   - Incremental backups (only new/changed documents)
   - Backup verification with checksums
   - Retention policies (auto-cleanup after X days)
   - Google Drive OAuth redirect (goes to home page, not 404)

---

_This document was generated by Mistral Vibe for tracking changes to the Papra backup system. Updated with Docker setup information._
