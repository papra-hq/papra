import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createFoldersRepository } from '../folders/folders.repository';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { getFileStreamFromMultipartForm } from '../shared/streams/file-upload';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { backupDestinationIdRegex, backupRunIdRegex } from './backups.constants';
import { createBackupsRepository } from './backups.repository';
import { createBackupsServices } from './backups.services';
import {
  createDestinationUsecase,
  deleteDestinationUsecase,
  deleteRunUsecase,
  downloadBackupCopyUsecase,
  listDestinationsUsecase,
  listRemoteBackupsUsecase,
  listRunsUsecase,
  renameDestinationUsecase,
  restoreFromRemoteFileUsecase,
  restoreFromUploadedFileUsecase,
  restoreRunUsecase,
  runBackupUsecase,
  testDestinationConnectionUsecase,
  updateDestinationScheduleUsecase,
} from './backups.usecases';
import { BACKUP_DRIVER_NAMES, GOOGLE_DRIVE_DRIVER_NAME } from './drivers/drivers.registry';
import { registerGoogleDriveOAuthRoutes } from './drivers/google-drive/google-drive.routes';

const backupDestinationIdSchema = v.pipe(v.string(), v.regex(backupDestinationIdRegex));
const backupRunIdSchema = v.pipe(v.string(), v.regex(backupRunIdRegex));

const scheduleSchema = v.object({
  isEnabled: v.boolean(),
  days: v.array(v.pipe(v.number(), v.minValue(0), v.maxValue(6))),
  hour: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(23))),
  minute: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(59))),
});

export function registerBackupsRoutes(context: RouteDefinitionContext) {
  setupListDriversRoute(context);
  setupTestConnectionRoute(context);
  setupCreateDestinationRoute(context);
  setupListDestinationsRoute(context);
  setupRenameDestinationRoute(context);
  setupUpdateScheduleRoute(context);
  setupDeleteDestinationRoute(context);
  setupListRunsRoute(context);
  setupRunBackupRoute(context);
  setupDeleteRunRoute(context);
  setupRestoreRunRoute(context);
  setupListRemoteBackupsRoute(context);
  setupRestoreFromRemoteFileRoute(context);
  setupRestoreFromUploadedFileRoute(context);
  setupDownloadBackupCopyRoute(context);
  registerGoogleDriveOAuthRoutes(context);
}

function setupListDriversRoute({ app, config }: RouteDefinitionContext) {
  app.get('/api/backups/drivers', requireAuthentication(), async (context) => {
    return context.json({
      isConfigured: Boolean(config.backups.kek),
      drivers: BACKUP_DRIVER_NAMES.map((name) => ({
        name,
        isConfigured: name === GOOGLE_DRIVE_DRIVER_NAME ? Boolean(config.backups.googleDrive.oauthClientId) : true,
      })),
    });
  });
}

function setupTestConnectionRoute({ app, config, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/backups/destinations/test-connection',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateJsonBody(
      v.object({
        driver: v.picklist(BACKUP_DRIVER_NAMES),
        credentials: v.record(v.string(), v.string()),
        settings: v.record(v.string(), v.unknown()),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { driver, credentials, settings } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const result = await testDestinationConnectionUsecase({ services, driver, credentials, settings });
      return context.json(result);
    },
  );
}

function setupCreateDestinationRoute({ app, config, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/backups/destinations',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateJsonBody(
      v.object({
        driver: v.picklist(BACKUP_DRIVER_NAMES),
        displayName: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
        credentials: v.record(v.string(), v.string()),
        settings: v.record(v.string(), v.unknown()),
      }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { driver, displayName, credentials, settings } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });

      const { destinationId } = await createDestinationUsecase({
        config,
        services,
        repository,
        organizationId,
        driver,
        displayName,
        credentials,
        settings,
      });

      return context.json({ destinationId }, 201);
    },
  );
}

function setupListDestinationsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/backups/destinations',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const repository = createBackupsRepository({ db });
      const { destinations } = await listDestinationsUsecase({ repository, organizationId });
      return context.json({ destinations });
    },
  );
}

function setupRenameDestinationRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/backups/destinations/:destinationId',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    validateJsonBody(v.object({ displayName: v.pipe(v.string(), v.minLength(1), v.maxLength(100)) })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');
      const { displayName } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const repository = createBackupsRepository({ db });
      await renameDestinationUsecase({ repository, organizationId, destinationId, displayName });
      return context.json({ renamed: true });
    },
  );
}

function setupUpdateScheduleRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/schedule',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    validateJsonBody(scheduleSchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');
      const schedule = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const repository = createBackupsRepository({ db });
      const { nextScheduledAt } = await updateDestinationScheduleUsecase({ repository, organizationId, destinationId, schedule });
      return context.json({ nextScheduledAt });
    },
  );
}

function setupDeleteDestinationRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/backups/destinations/:destinationId',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const repository = createBackupsRepository({ db });
      const { deleted } = await deleteDestinationUsecase({ repository, organizationId, destinationId });
      return context.json({ deleted });
    },
  );
}

function setupListRunsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/runs',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const repository = createBackupsRepository({ db });
      const { runs } = await listRunsUsecase({ repository, destinationId });
      return context.json({ runs });
    },
  );
}

function setupRunBackupRoute(deps: RouteDefinitionContext) {
  const { app, config, db } = deps;
  app.post(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/runs',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { runId } = await runBackupUsecase({
        config,
        services,
        repository,
        documentsRepository,
        globalDeps: deps,
        organizationId,
        destinationId,
        trigger: 'manual',
      });

      return context.json({ runId }, 202);
    },
  );
}

function setupDeleteRunRoute({ app, config, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/runs/:runId',
    requireAuthentication(),
    validateParams(
      v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema, runId: backupRunIdSchema }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId, runId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });

      const { deleted } = await deleteRunUsecase({ config, services, repository, organizationId, destinationId, runId });
      return context.json({ deleted });
    },
  );
}

function setupRestoreRunRoute(deps: RouteDefinitionContext) {
  const { app, config, db } = deps;
  app.post(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/runs/:runId/restore',
    requireAuthentication(),
    validateParams(
      v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema, runId: backupRunIdSchema }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId, runId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const foldersRepository = createFoldersRepository({ db });

      const result = await restoreRunUsecase({
        config,
        services,
        repository,
        documentUsecaseDeps: { ...deps },
        documentsRepository,
        foldersRepository,
        organizationId,
        destinationId,
        runId,
        userId,
      });

      return context.json(result);
    },
  );
}

// Disaster recovery: browse what's actually sitting on the destination (not
// what our local DB remembers) — needed on a fresh install where the local
// database has no run history yet.
function setupListRemoteBackupsRoute({ app, config, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/remote-files',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });

      const { files } = await listRemoteBackupsUsecase({ config, services, repository, organizationId, destinationId });
      return context.json({ files });
    },
  );
}

function setupRestoreFromRemoteFileRoute(deps: RouteDefinitionContext) {
  const { app, config, db } = deps;
  app.post(
    '/api/organizations/:organizationId/backups/destinations/:destinationId/remote-files/restore',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, destinationId: backupDestinationIdSchema })),
    validateJsonBody(v.object({ remoteFileId: v.pipe(v.string(), v.minLength(1)) })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, destinationId } = context.req.valid('param');
      const { remoteFileId } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const repository = createBackupsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const foldersRepository = createFoldersRepository({ db });

      const result = await restoreFromRemoteFileUsecase({
        config,
        services,
        repository,
        documentUsecaseDeps: { ...deps },
        documentsRepository,
        foldersRepository,
        organizationId,
        destinationId,
        remoteFileId,
        userId,
      });

      return context.json(result);
    },
  );
}

// Disaster recovery, no destination at all: the person already has the backup
// file (copied off their phone/SD card/wherever) and just uploads it directly.
// No credentials, no host, no connection of any kind — just the file plus
// BACKUPS_KEK.
function setupRestoreFromUploadedFileRoute(deps: RouteDefinitionContext) {
  const { app, config, db } = deps;
  app.post(
    '/api/organizations/:organizationId/backups/recover-from-file',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { fileStream } = await getFileStreamFromMultipartForm({
        body: context.req.raw.body,
        headers: Object.fromEntries(context.req.raw.headers.entries()),
      });

      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const envelope = Buffer.concat(chunks);

      const services = createBackupsServices({ config });
      const documentsRepository = createDocumentsRepository({ db });
      const foldersRepository = createFoldersRepository({ db });

      const result = await restoreFromUploadedFileUsecase({
        config,
        services,
        documentUsecaseDeps: { ...deps },
        documentsRepository,
        foldersRepository,
        organizationId,
        envelope,
        userId,
      });

      return context.json(result);
    },
  );
}

// One-off manual export straight to the browser — no destination, nothing
// persisted, not tracked in run history (there's no destination for a run row
// to belong to).
function setupDownloadBackupCopyRoute({ app, config, db, documentsStorageService }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/backups/download-copy',
    requireAuthentication(),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const services = createBackupsServices({ config });
      const documentsRepository = createDocumentsRepository({ db });

      const { envelope, fileName } = await downloadBackupCopyUsecase({
        config,
        services,
        documentsRepository,
        documentsStorageService,
        organizationId,
        db,
      });

      return context.body(new Uint8Array(envelope), 200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': String(envelope.length),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      });
    },
  );
}
