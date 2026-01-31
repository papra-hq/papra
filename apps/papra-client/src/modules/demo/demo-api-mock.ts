import type { ApiKey } from '../api-keys/api-keys.types';
import type { Document } from '../documents/documents.types';
import type { Webhook } from '../webhooks/webhooks.types';
import type {
  DocumentFile,
} from './demo.storage';
import { FetchError } from 'ofetch';
import { createRouter } from 'radix3';
import { get } from '../shared/utils/get';
import { defineHandler } from './demo-api-mock.models';
import { createId, randomString } from './demo.models';
import {
  apiKeyStorage,
  documentFileStorage,
  documentStorage,
  organizationStorage,
  tagDocumentStorage,
  taggingRuleStorage,
  tagStorage,
  webhooksStorage,
} from './demo.storage';
import { findMany, getValues } from './demo.storage.models';
import { searchDemoDocuments } from './search/demo.search.services';
import { demoUser } from './seed/users.fixtures';

function assert(condition: unknown, { message = 'Error', status }: { message?: string; status?: number } = {}): asserts condition {
  if (!condition) {
    throw Object.assign(new FetchError(message), { status });
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function fromBase64(base64: string) {
  return fetch(base64).then(res => res.blob());
}

async function serializeFile(file: File): Promise<DocumentFile> {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    // base64
    base64Content: await toBase64(file),
  };
}

async function deserializeFile(storageInfo: DocumentFile): Promise<File> {
  if ('path' in storageInfo) {
    const { path, name } = storageInfo;
    const response = await fetch(path);
    const blob = await response.blob();
    return new File([blob], name);
  }

  const { name, type, base64Content } = storageInfo;

  return new File([await fromBase64(base64Content)], name, { type });
}

const inMemoryApiMock: Record<string, { handler: any }> = {
  ...defineHandler({
    path: '/api/config',
    method: 'GET',
    handler: () => ({
      config: {
        auth: {
          isEmailVerificationRequired: false,
          isPasswordResetEnabled: false,
          providers: {
            github: { isEnabled: false },
          },
        },
      },
    }),
  }),

  ...defineHandler({
    path: '/api/users/me',
    method: 'GET',
    handler: () => ({
      user: demoUser,
    }),
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents',
    method: 'GET',
    handler: async ({ params: { organizationId }, query }) => {
      const organization = await organizationStorage.getItem(organizationId);
      assert(organization, { status: 403 });

      const documents = await findMany(documentStorage, document => document.organizationId === organizationId && !document.deletedAt);

      const filteredDocuments = await Promise.all(
        documents.map(async (document) => {
          const tagDocuments = await findMany(tagDocumentStorage, tagDocument => tagDocument?.documentId === document?.id);
          const allTags = await getValues(tagStorage);

          const tags = allTags.filter(tag => tagDocuments.some(tagDocument => tagDocument?.tagId === tag?.id));

          return {
            ...document,
            tags,
          };
        }),
      );

      const {
        pageIndex = 0,
        pageSize = 10,
      } = query ?? {};

      return {
        documents: filteredDocuments
          .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        documentsCount: filteredDocuments.length,
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents',
    method: 'POST',
    handler: async ({ params: { organizationId }, body }) => {
      // body is a FormData instance with file field

      const file = (body as FormData).get('file') as File;

      assert(file, { status: 400 });

      const document = {
        id: createId({ prefix: 'doc' }),
        organizationId,
        name: file.name,
        originalName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };

      const key = `${organizationId}:${document.id}`;

      await documentFileStorage.setItem(key, await serializeFile(file));
      await documentStorage.setItem(key, document);

      // Simulate a slow response
      await new Promise(resolve => setTimeout(resolve, 500));

      return { document };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/customer-portal',
    method: 'GET',
    handler: async () => {
      throw Object.assign(new FetchError('Not available in demo'), { status: 501 });
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/statistics',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const documents = await findMany(documentStorage, document => document.organizationId === organizationId);

      return {
        organizationStats: {
          documentsCount: documents.length,
          documentsSize: documents.reduce((acc, document) => acc + document.originalSize, 0),
        },
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/search',
    method: 'GET',
    handler: async ({ params: { organizationId }, query }) => {
      const {
        pageIndex = 0,
        pageSize = 5,
        searchQuery: rawSearchQuery = '',
      } = query ?? {};

      const organization = await organizationStorage.getItem(organizationId);
      assert(organization, { status: 403 });

      const searchQuery = rawSearchQuery.trim();
      const [organizationDocuments, allTags, tagDocuments] = await Promise.all([
        findMany(documentStorage, document => document?.organizationId === organizationId && !document?.deletedAt),
        getValues(tagStorage),
        getValues(tagDocumentStorage),
      ]);

      const documentsWithTags = organizationDocuments.map((document) => {
        const documentTagDocuments = tagDocuments.filter(tagDocument => tagDocument?.documentId === document?.id);
        const tags = allTags.filter(tag => documentTagDocuments.some(tagDocument => tagDocument?.tagId === tag?.id));

        return {
          ...document,
          tags,
        };
      });

      const filteredDocuments = searchDemoDocuments({ query: searchQuery, documents: documentsWithTags as Document[] });

      const paginatedDocuments = filteredDocuments
        .toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

      return {
        documents: paginatedDocuments,
        totalCount: filteredDocuments.length,
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/deleted',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);
      assert(organization, { status: 403 });

      const deletedDocuments = await findMany(
        documentStorage,
        document => document.organizationId === organizationId && document.deletedAt !== undefined,
      );

      return {
        documents: deletedDocuments,
        documentsCount: deletedDocuments.length,
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId',
    method: 'GET',
    handler: async ({ params: { organizationId, documentId } }) => {
      const key = `${organizationId}:${documentId}`;
      const document = await documentStorage.getItem(key);

      assert(document, { status: 404 });

      const tagDocuments = await findMany(tagDocumentStorage, tagDocument => tagDocument.documentId === documentId);
      const tags = await findMany(tagStorage, tag => tagDocuments.some(tagDocument => tagDocument.tagId === tag.id));

      return {
        document: {
          ...document,
          tags,
        },
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId/restore',
    method: 'POST',
    handler: async ({ params: { organizationId, documentId } }) => {
      const key = `${organizationId}:${documentId}`;
      const document = await documentStorage.getItem(key);

      assert(document, { status: 404 });

      document.deletedAt = undefined;
      document.deletedBy = undefined;
      document.updatedAt = new Date();

      await documentStorage.setItem(key, document);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId',
    method: 'DELETE',
    handler: async ({ params: { organizationId, documentId } }) => {
      const key = `${organizationId}:${documentId}`;

      const document = await documentStorage.getItem(key);
      assert(document, { status: 404 });

      const now = new Date();

      document.deletedAt = now;
      document.updatedAt = now;
      document.deletedBy = 'usr_1';

      await documentStorage.setItem(key, document);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId/file',
    method: 'GET',
    handler: async ({ params }) => {
      const { organizationId, documentId } = params;
      const key = `${organizationId}:${documentId}`;

      const file = await documentFileStorage.getItem(key);

      assert(file, { status: 404 });

      return deserializeFile(file);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tags',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const tags = await findMany(tagStorage, tag => tag.organizationId === organizationId);
      const documents = await findMany(documentStorage, document => document.organizationId === organizationId);

      const tagsWithDocumentsCount = tags.map(tag => ({
        ...tag,
        documentsCount: documents.filter(document => document.tags.some(t => t.id === tag.id)).length,
      }));

      return {
        tags: tagsWithDocumentsCount,
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tags',
    method: 'POST',
    handler: async ({ params: { organizationId }, body }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const name = get(body, ['name']) as string;
      const existingTagsWithSameName = await findMany(tagStorage, tag => tag.organizationId === organizationId && tag.name.toLowerCase() === name.toLowerCase());

      if (existingTagsWithSameName.length > 0) {
        throw Object.assign(new FetchError('Tag already exists'), {
          status: 400,
          data: { error: { code: 'tags.already_exists' } },
        });
      }

      const tag = {
        id: createId({ prefix: 'tag' }),
        organizationId,
        name,
        color: get(body, ['color']) as string,
        description: (get(body, ['description']) ?? null) as string | null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tagStorage.setItem(tag.id, tag);

      return { tag };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tags/:tagId',
    method: 'PUT',
    handler: async ({ params: { organizationId, tagId }, body }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const tag = await tagStorage.getItem(tagId);

      assert(tag, { status: 404 });

      const newName = get(body, ['name']) as string | undefined;
      if (newName) {
        const existingTagsWithSameName = await findMany(
          tagStorage,
          t =>
            t.organizationId === organizationId
            && t.id !== tagId
            && t.name.toLowerCase() === newName.toLowerCase(),
        );

        if (existingTagsWithSameName.length > 0) {
          throw Object.assign(new FetchError('Tag already exists'), {
            status: 400,
            data: { error: { code: 'tags.already_exists' } },
          });
        }
      }

      await tagStorage.setItem(tagId, Object.assign(tag, body, { updatedAt: new Date() }));

      return { tag };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tags/:tagId',
    method: 'DELETE',
    handler: async ({ params: { organizationId, tagId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      await tagStorage.removeItem(tagId);

      const tagDocuments = await findMany(tagDocumentStorage, tagDocument => tagDocument.tagId === tagId);

      await Promise.all(tagDocuments.map(tagDocument => tagDocumentStorage.removeItem(tagDocument.id)));
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId/tags',
    method: 'POST',
    handler: async ({ params: { organizationId, documentId }, body }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const tagId = get(body, ['tagId']) as string;

      assert(tagId, { status: 400 });

      const tagDocument = {
        id: createId({ prefix: 'tagDoc' }),
        tagId,
        documentId,
        createdAt: new Date(),
      };

      await tagDocumentStorage.setItem(tagDocument.id, tagDocument);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId/tags/:tagId',
    method: 'DELETE',
    handler: async ({ params: { organizationId, documentId, tagId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const tagDocuments = await findMany(tagDocumentStorage, tagDocument => tagDocument.tagId === tagId && tagDocument.documentId === documentId);

      await Promise.all(tagDocuments.map(tagDocument => tagDocumentStorage.removeItem(tagDocument.id)));
    },
  }),

  ...defineHandler({
    path: '/api/organizations',
    method: 'GET',
    handler: async () => {
      const organizations = await getValues(organizationStorage);

      return { organizations };
    },
  }),

  ...defineHandler({
    path: '/api/organizations',
    method: 'POST',
    handler: async ({ body }) => {
      const organization = {
        id: createId({ prefix: 'org' }),
        name: get(body, ['name']) as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await organizationStorage.setItem(organization.id, organization);

      return { organization };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      return { organization };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId',
    method: 'DELETE',
    handler: async ({ params: { organizationId } }) => {
      await organizationStorage.removeItem(organizationId);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId',
    method: 'PUT',
    handler: async ({ params: { organizationId }, body }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      organization.name = get(body, ['name']) as string;
      organization.updatedAt = new Date();

      await organizationStorage.setItem(organizationId, organization);

      return { organization };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tagging-rules',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const taggingRules = await findMany(taggingRuleStorage, taggingRule => taggingRule.organizationId === organizationId);

      return { taggingRules };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tagging-rules',
    method: 'POST',
    handler: async ({ params: { organizationId }, body }) => {
      const taggingRule = {
        id: createId({ prefix: 'tr' }),
        organizationId,
        name: get(body, ['name']) as string,
        description: (get(body, ['description']) ?? '') as string,
        conditions: get(body, ['conditions']) as any,
        actions: (get(body, ['tagIds']) as string[]).map((tagId: string) => ({ tagId })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await taggingRuleStorage.setItem(taggingRule.id, taggingRule);

      return { taggingRule };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    method: 'GET',
    handler: async ({ params: { taggingRuleId } }) => {
      const taggingRule = await taggingRuleStorage.getItem(taggingRuleId);

      assert(taggingRule, { status: 404 });

      return { taggingRule };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    method: 'DELETE',
    handler: async ({ params: { taggingRuleId } }) => {
      await taggingRuleStorage.removeItem(taggingRuleId);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/tagging-rules/:taggingRuleId',
    method: 'PUT',
    handler: async ({ params: { taggingRuleId }, body }) => {
      const taggingRule = await taggingRuleStorage.getItem(taggingRuleId);

      assert(taggingRule, { status: 404 });

      await taggingRuleStorage.setItem(taggingRuleId, Object.assign(taggingRule, body, { updatedAt: new Date() }));

      return { taggingRule };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/trash',
    method: 'DELETE',
    handler: async ({ params: { organizationId } }) => {
      const documents = await findMany(documentStorage, document => document.organizationId === organizationId && Boolean(document.deletedAt));

      await Promise.all(documents.map(document => documentStorage.removeItem(`${organizationId}:${document.id}`)));
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/trash/:documentId',
    method: 'DELETE',
    handler: async ({ params: { organizationId, documentId } }) => {
      const key = `${organizationId}:${documentId}`;

      await documentStorage.removeItem(key);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/members',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      return {
        members: [{
          id: 'mem_1',
          user: demoUser,
          role: 'owner',
          organizationId,
        }],
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/members/invitations',
    method: 'POST',
    handler: async () => {
      throw Object.assign(new FetchError('Not available in demo'), {
        status: 501,
        data: {
          error: {
            message: 'This feature is not available in demo',
            code: 'demo.not_available',
          },
        },
      });
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/members/me',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      return {
        member: {
          id: 'mem_1',
          role: 'owner',
          organizationId,
        },
      };
    },
  }),

  ...defineHandler({
    path: '/api/api-keys',
    method: 'GET',
    handler: async () => {
      const apiKeys = await getValues(apiKeyStorage);

      return { apiKeys };
    },
  }),

  ...defineHandler({
    path: '/api/api-keys',
    method: 'POST',
    handler: async ({ body }) => {
      const token = `ppapi_${randomString({ length: 64 })}`;

      const apiKey = {
        id: createId({ prefix: 'apiKey' }),
        name: get(body, ['name']),
        permissions: get(body, ['permissions']),
        organizationIds: get(body, ['organizationIds']),
        allOrganizations: get(body, ['allOrganizations']),
        expiresAt: get(body, ['expiresAt']),
        createdAt: new Date(),
        updatedAt: new Date(),
        prefix: token.slice(0, 11),
      } as ApiKey;

      await apiKeyStorage.setItem(apiKey.id, apiKey);

      return { apiKey, token };
    },
  }),

  ...defineHandler({
    path: '/api/api-keys/:apiKeyId',
    method: 'DELETE',
    handler: async ({ params: { apiKeyId } }) => {
      await apiKeyStorage.removeItem(apiKeyId);
    },
  }),

  ...defineHandler({
    path: '/api/invitations/count',
    method: 'GET',
    handler: async () => ({ pendingInvitationsCount: 0 }),
  }),

  ...defineHandler({
    path: '/api/invitations',
    method: 'GET',
    handler: async () => ({ invitations: [] }),
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/webhooks',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const webhooks = await findMany(webhooksStorage, webhook => webhook.organizationId === organizationId);

      return { webhooks };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/webhooks',
    method: 'POST',
    handler: async ({ params: { organizationId }, body }) => {
      const webhook: Webhook = {
        id: createId({ prefix: 'webhook' }),
        organizationId,
        name: get(body, ['name']) as string,
        url: get(body, ['url']) as string,
        enabled: true,
        events: get(body, ['events']) as Webhook['events'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await webhooksStorage.setItem(webhook.id, webhook);

      return { webhook };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/webhooks/:webhookId',
    method: 'GET',
    handler: async ({ params: { webhookId } }) => {
      const webhook = await webhooksStorage.getItem(webhookId);
      return { webhook };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/webhooks/:webhookId',
    method: 'DELETE',
    handler: async ({ params: { webhookId } }) => {
      await webhooksStorage.removeItem(webhookId);
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/webhooks/:webhookId',
    method: 'PUT',
    handler: async ({ params: { webhookId }, body }) => {
      const webhook = await webhooksStorage.getItem(webhookId);

      assert(webhook, { status: 404 });

      await webhooksStorage.setItem(webhookId, Object.assign(webhook, body, { updatedAt: new Date() }));

      return { webhook };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId',
    method: 'PATCH',
    handler: async ({ params: { organizationId, documentId }, body }) => {
      const document = await documentStorage.getItem(`${organizationId}:${documentId}`);

      assert(document, { status: 404 });

      const { name, content } = body as { name?: string; content?: string };

      const newDocument = {
        ...document,
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        updatedAt: new Date(),
      };

      await documentStorage.setItem(`${organizationId}:${documentId}`, newDocument);

      return { document: newDocument };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/:documentId/activity',
    method: 'GET',
    handler: async ({ params: { organizationId, documentId }, query }) => {
      const key = `${organizationId}:${documentId}`;
      const document = await documentStorage.getItem(key);

      assert(document, { status: 404 });

      const {
        pageIndex = 0,
      } = query ?? {};

      // Return mock activity for demo - just a created event
      const activities = pageIndex === 0
        ? [{
            id: 'activity_1',
            documentId,
            event: 'created',
            eventData: {},
            createdAt: document.createdAt,
            user: {
              id: 'usr_1',
              name: 'Sherlock Holmes',
            },
          }]
        : [];

      return { activities };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/subscription',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      // Demo mode uses free plan with no subscription
      return {
        subscription: null,
        plan: {
          id: 'free',
          name: 'Free',
          limits: {
            maxDocumentStorageBytes: 1024 * 1024 * 500, // 500 MiB
            maxIntakeEmailsCount: 1,
            maxOrganizationsMembersCount: 3,
            maxFileSize: 1024 * 1024 * 50, // 50 MiB
          },
        },
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/usage',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      const documents = await findMany(documentStorage, document => document.organizationId === organizationId);

      const totalDocumentsSize = documents.reduce((acc, doc) => acc + (doc.originalSize ?? 0), 0);
      const deletedDocumentsSize = documents
        .filter(doc => doc.deletedAt)
        .reduce((acc, doc) => acc + (doc.originalSize ?? 0), 0);

      return {
        usage: {
          documentsStorage: {
            used: totalDocumentsSize,
            deleted: deletedDocumentsSize,
            limit: 1024 * 1024 * 500, // 500 MiB
          },
          intakeEmailsCount: {
            used: 0,
            limit: 1,
          },
          membersCount: {
            used: 1,
            limit: 3,
          },
        },
        limits: {
          maxDocumentStorageBytes: 1024 * 1024 * 500, // 500 MiB
          maxIntakeEmailsCount: 1,
          maxOrganizationsMembersCount: 3,
          maxFileSize: 1024 * 1024 * 50, // 50 MiB
        },
      };
    },
  }),
};

export const router = createRouter({ routes: inMemoryApiMock, strictTrailingSlash: false });
