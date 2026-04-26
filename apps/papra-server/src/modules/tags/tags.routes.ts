import type { RouteDefinitionContext } from '../app/server.types';
import * as v from 'valibot';
import { API_KEY_PERMISSIONS } from '../api-keys/api-keys.constants';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { createDocumentActivityRepository } from '../documents/document-activity/document-activity.repository';
import { deferRegisterDocumentActivityLog } from '../documents/document-activity/document-activity.usecases';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentIdSchema } from '../documents/documents.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { createTagNotFoundError } from './tags.errors';
import { createTagsRepository } from './tags.repository';
import { tagColorSchema, tagDescriptionSchema, tagIdSchema, tagNameSchema } from './tags.schemas';
import { addTagToDocument, createTag } from './tags.usecases';

export function registerTagsRoutes(context: RouteDefinitionContext) {
  setupCreateNewTagRoute(context);
  setupGetOrganizationTagsRoute(context);
  setupUpdateTagRoute(context);
  setupDeleteTagRoute(context);
  setupAddTagToDocumentRoute(context);
  setupRemoveTagFromDocumentRoute(context);
}

function setupCreateNewTagRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/tags',
    requireAuthentication({ apiKeyPermissions: ['tags:create'] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    validateJsonBody(v.strictObject({
      name: tagNameSchema,
      color: tagColorSchema,
      description: v.optional(tagDescriptionSchema),
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { name, color, description } = context.req.valid('json');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tag } = await createTag({ organizationId, name, color, description, config, tagsRepository });

      return context.json({
        tag,
      });
    },
  );
}

function setupGetOrganizationTagsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/tags',
    requireAuthentication({ apiKeyPermissions: ['tags:read'] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tags } = await tagsRepository.getOrganizationTags({ organizationId });

      return context.json({
        tags,
      });
    },
  );
}

function setupUpdateTagRoute({ app, db }: RouteDefinitionContext) {
  app.put(
    '/api/organizations/:organizationId/tags/:tagId',
    requireAuthentication({ apiKeyPermissions: ['tags:update'] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      tagId: tagIdSchema,
    })),
    validateJsonBody(v.strictObject({
      name: v.optional(tagNameSchema),
      color: v.optional(tagColorSchema),
      description: v.optional(tagDescriptionSchema),
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, tagId } = context.req.valid('param');
      const { name, color, description } = context.req.valid('json');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tag } = await tagsRepository.updateTag({ tagId, name, color, description });

      return context.json({
        tag,
      });
    },
  );
}

function setupDeleteTagRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/tags/:tagId',
    requireAuthentication({ apiKeyPermissions: ['tags:delete'] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      tagId: tagIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, tagId } = context.req.valid('param');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.deleteTag({ tagId });

      return context.json({});
    },
  );
}

function setupAddTagToDocumentRoute({ app, db, webhookTriggerServices }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/tags',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.UPDATE, API_KEY_PERMISSIONS.TAGS.READ] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),
    validateJsonBody(v.strictObject({
      tagId: tagIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');
      const { tagId } = context.req.valid('json');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const [{ document }, { tag }] = await Promise.all([
        documentsRepository.getDocumentById({ organizationId, documentId }),
        tagsRepository.getTagById({ tagId, organizationId }),
      ]);

      if (!document) {
        throw createDocumentNotFoundError();
      }

      if (!tag) {
        throw createTagNotFoundError();
      }

      await addTagToDocument({
        tagId,
        documentId,
        organizationId,
        userId,
        tag,
        tagsRepository,
        webhookTriggerServices,
        documentActivityRepository,
      });

      return context.body(null, 204);
    },
  );
}

function setupRemoveTagFromDocumentRoute({ app, db, webhookTriggerServices }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId/tags/:tagId',
    requireAuthentication({ apiKeyPermissions: [API_KEY_PERMISSIONS.DOCUMENTS.UPDATE, API_KEY_PERMISSIONS.TAGS.READ] }),
    validateParams(v.strictObject({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
      tagId: tagIdSchema,
    })),
    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId, tagId } = context.req.valid('param');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });
      const documentActivityRepository = createDocumentActivityRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const [{ document }, { tag }] = await Promise.all([
        documentsRepository.getDocumentById({ organizationId, documentId }),
        tagsRepository.getTagById({ tagId, organizationId }),
      ]);

      if (!document) {
        throw createDocumentNotFoundError();
      }

      if (!tag) {
        throw createTagNotFoundError();
      }

      await tagsRepository.removeTagFromDocument({ tagId, documentId });

      webhookTriggerServices.deferTriggerWebhooks({
        organizationId,
        event: 'document:tag:removed',
        payloads: [{ documentId, organizationId, tagId, tagName: tag.name }],
      });

      deferRegisterDocumentActivityLog({
        documentId,
        event: 'untagged',
        userId,
        documentActivityRepository,
        tagId,
      });

      return context.body(null, 204);
    },
  );
}
