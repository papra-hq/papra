import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { API_KEY_PERMISSIONS } from '../api-keys/api-keys.constants';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { formatDocumentsForApi } from '../documents/documents.models';
import { validateJsonBody, validateParams, validateQuery } from '../shared/validation/validation';
import { createFolderNotFoundError } from './folders.errors';
import { createFoldersRepository } from './folders.repository';
import {
  createFolderBodySchema,
  folderIdSchema,
  updateFolderBodySchema,
} from './folders.schemas';
import { createFolder, deleteFolder, moveOrRenameFolder } from './folders.usecases';

export function registerFoldersRoutes(context: RouteDefinitionContext) {
  setupCreateFolderRoute(context);
  setupGetOrganizationFoldersRoute(context);
  setupGetFolderContentsRoute(context);
  setupGetFolderRoute(context);
  setupUpdateFolderRoute(context);
  setupDeleteFolderRoute(context);
}

function setupCreateFolderRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/folders',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.CREATE] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateJsonBody(createFolderBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { name, parentId } = context.req.valid('json');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { folder } = await createFolder({
        organizationId,
        name,
        parentId,
        foldersRepository,
      });

      return context.json({ folder });
    },
  );
}

// Flat list of every folder in the org (with direct document counts), meant
// for building a full tree client-side without N round trips.
function setupGetOrganizationFoldersRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/folders',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.READ] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { folders } = await foldersRepository.getOrganizationFolders({ organizationId });

      return context.json({ folders });
    },
  );
}

// Google-Drive-style "browse" endpoint: direct subfolders + direct documents.
// Omit folderId (or pass nothing) to browse the organization root.
function setupGetFolderContentsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/folders/contents',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.READ] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    validateQuery(v.strictObject({ folderId: v.optional(folderIdSchema) })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');
      const { folderId } = context.req.valid('query');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      if (folderId) {
        const { folder } = await foldersRepository.getFolderById({ folderId, organizationId });
        if (!folder) {
          throw createFolderNotFoundError();
        }
      }

      const { folders, documents } = await foldersRepository.getFolderContents({
        organizationId,
        folderId: folderId ?? null,
      });

      return context.json({
        folders,
        documents: formatDocumentsForApi({ documents }),
      });
    },
  );
}

function setupGetFolderRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/folders/:folderId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.READ] }),
    validateParams(
      v.strictObject({ organizationId: organizationIdSchema, folderId: folderIdSchema }),
    ),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, folderId } = context.req.valid('param');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { folder } = await foldersRepository.getFolderById({ folderId, organizationId });

      if (!folder) {
        throw createFolderNotFoundError();
      }

      return context.json({ folder });
    },
  );
}

function setupUpdateFolderRoute({ app, db }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/folders/:folderId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.UPDATE] }),
    validateParams(
      v.strictObject({ organizationId: organizationIdSchema, folderId: folderIdSchema }),
    ),
    validateJsonBody(updateFolderBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, folderId } = context.req.valid('param');
      const { name, parentId } = context.req.valid('json');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { folder } = await moveOrRenameFolder({
        folderId,
        organizationId,
        name,
        parentId,
        foldersRepository,
      });

      return context.json({ folder });
    },
  );
}

function setupDeleteFolderRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/folders/:folderId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.FOLDERS.DELETE] }),
    validateParams(
      v.strictObject({ organizationId: organizationIdSchema, folderId: folderIdSchema }),
    ),
    validateQuery(v.strictObject({ force: v.optional(v.picklist(['true', 'false']), 'false') })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, folderId } = context.req.valid('param');
      const { force } = context.req.valid('query');

      const foldersRepository = createFoldersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await deleteFolder({
        folderId,
        organizationId,
        force: force === 'true',
        foldersRepository,
      });

      return context.body(null, 204);
    },
  );
}
