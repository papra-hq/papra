import type { RouteDefinitionContext } from '../app/server.types';
import { z } from 'zod';
import { getUser } from '../app/auth/auth.models';
import { documentIdSchema } from '../documents/documents.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { TagColorRegex } from './tags.constants';
import { createTagsRepository } from './tags.repository';
import { tagIdSchema } from './tags.schemas';

export function registerTagsRoutes(context: RouteDefinitionContext) {
  setupCreateNewTagRoute(context);
  setupGetOrganizationTagsRoute(context);
  setupUpdateTagRoute(context);
  setupDeleteTagRoute(context);
  setupAddTagToDocumentRoute(context);
  setupRemoveTagFromDocumentRoute(context);
}

function setupCreateNewTagRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/tags',

    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),

    validateJsonBody(z.object({
      name: z.string().min(1).max(50),
      color: z.string().regex(TagColorRegex, 'Invalid Color format, must be a hex color code like #000000'),
      description: z.string().max(256).optional(),
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId } = context.req.valid('param');
      const { name, color, description } = context.req.valid('json');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const { tag } = await tagsRepository.createTag({ tag: { organizationId, name, color, description } });

      return context.json({
        tag,
      });
    },
  );
}

function setupGetOrganizationTagsRoute({ app, db }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/tags',

    validateParams(z.object({
      organizationId: organizationIdSchema,
    })),

    async (context) => {
      const { organizationId } = context.req.valid('param');

      const tagsRepository = createTagsRepository({ db });

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

    validateParams(z.object({
      organizationId: organizationIdSchema,
      tagId: tagIdSchema,
    })),

    validateJsonBody(z.object({
      name: z.string().min(1).max(64).optional(),
      color: z.string().regex(TagColorRegex, 'Invalid Color format, must be a hex color code like #000000').optional(),
      description: z.string().max(256).optional(),
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

    validateParams(z.object({
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

function setupAddTagToDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/tags',

    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
    })),

    validateJsonBody(z.object({
      tagId: tagIdSchema,
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');
      const { tagId } = context.req.valid('json');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.addTagToDocument({ tagId, documentId });

      return context.body(null, 204);
    },
  );
}

function setupRemoveTagFromDocumentRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId/tags/:tagId',

    validateParams(z.object({
      organizationId: organizationIdSchema,
      documentId: documentIdSchema,
      tagId: tagIdSchema,
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId, tagId } = context.req.valid('param');

      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.removeTagFromDocument({ tagId, documentId });

      return context.body(null, 204);
    },
  );
}
