import type { ServerInstance } from '../app/server.types';
import { z } from 'zod';
import { getUser } from '../app/auth/auth.models';
import { getDb } from '../app/database/database.models';
import { organizationIdRegex } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { TagColorRegex } from './tags.constants';
import { createTagsRepository } from './tags.repository';

export function registerTagsRoutes({ app }: { app: ServerInstance }) {
  setupCreateNewTagRoute({ app });
  setupGetOrganizationTagsRoute({ app });
  setupUpdateTagRoute({ app });
  setupDeleteTagRoute({ app });

  setupAddTagToDocumentRoute({ app });
  setupRemoveTagFromDocumentRoute({ app });
}

function setupCreateNewTagRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations/:organizationId/tags',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
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

      const { db } = getDb({ context });
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

function setupGetOrganizationTagsRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/organizations/:organizationId/tags',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
    })),

    async (context) => {
      const { organizationId } = context.req.valid('param');

      const { db } = getDb({ context });
      const tagsRepository = createTagsRepository({ db });

      const { tags } = await tagsRepository.getOrganizationTags({ organizationId });

      return context.json({
        tags,
      });
    },
  );
}

function setupUpdateTagRoute({ app }: { app: ServerInstance }) {
  app.put(
    '/api/organizations/:organizationId/tags/:tagId',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      tagId: z.string(),
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

      const { db } = getDb({ context });
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

function setupDeleteTagRoute({ app }: { app: ServerInstance }) {
  app.delete(
    '/api/organizations/:organizationId/tags/:tagId',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      tagId: z.string(),
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, tagId } = context.req.valid('param');

      const { db } = getDb({ context });
      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.deleteTag({ tagId });

      return context.json({});
    },
  );
}

function setupAddTagToDocumentRoute({ app }: { app: ServerInstance }) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/tags',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
    })),

    validateJsonBody(z.object({
      tagId: z.string(),
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId } = context.req.valid('param');
      const { tagId } = context.req.valid('json');

      const { db } = getDb({ context });
      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.addTagToDocument({ tagId, documentId });

      return context.body(null, 204);
    },
  );
}

function setupRemoveTagFromDocumentRoute({ app }: { app: ServerInstance }) {
  app.delete(
    '/api/organizations/:organizationId/documents/:documentId/tags/:tagId',

    validateParams(z.object({
      organizationId: z.string().regex(organizationIdRegex),
      documentId: z.string(),
      tagId: z.string(),
    })),

    async (context) => {
      const { userId } = getUser({ context });

      const { organizationId, documentId, tagId } = context.req.valid('param');

      const { db } = getDb({ context });
      const tagsRepository = createTagsRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      await tagsRepository.removeTagFromDocument({ tagId, documentId });

      return context.body(null, 204);
    },
  );
}
