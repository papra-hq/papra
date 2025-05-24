import type { ApiKey } from '../api-keys/api-keys.types';
import type { Webhook } from '../webhooks/webhooks.types';
import { get } from 'lodash-es';
import { FetchError } from 'ofetch';
import { createRouter } from 'radix3';
import { defineHandler } from './demo-api-mock.models';
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

const corpus = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomString({ length = 10 }: { length?: number } = {}) {
  return Array.from({ length }, () => corpus[Math.floor(Math.random() * corpus.length)]).join('');
}

function createId({ prefix }: { prefix: string }) {
  return `${prefix}_${randomString({ length: 24 })}`;
}

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

async function serializeFile(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    // base64
    content: await toBase64(file),
  };
}

async function deserializeFile({ name, type, content }: Awaited<ReturnType<typeof serializeFile>>) {
  return new File([await fromBase64(content)], name, { type });
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
      user: {
        id: 'usr_1',
        email: 'jane.doe@papra.app',
        name: 'Jane Doe',
        roles: [],
      },
    }),
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents',
    method: 'GET',
    handler: async ({ params: { organizationId }, query }) => {
      const organization = organizationStorage.getItem(organizationId);
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
        documents: filteredDocuments.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
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
        searchQuery = '',
      } = query ?? {};

      const organization = organizationStorage.getItem(organizationId);
      assert(organization, { status: 403 });

      const documents = await findMany(documentStorage, document => document?.organizationId === organizationId);

      const filteredDocuments = documents.filter(document => document?.name.includes(searchQuery) && !document?.deletedAt);

      return {
        documents: filteredDocuments.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
        documentsCount: filteredDocuments.length,
      };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents/deleted',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = organizationStorage.getItem(organizationId);
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

      const tag = {
        id: createId({ prefix: 'tag' }),
        organizationId,
        name: get(body, 'name'),
        color: get(body, 'color'),
        description: get(body, 'description'),
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

      const tagId = get(body, 'tagId');

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
        name: get(body, 'name'),
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

      organization.name = get(body, 'name');
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
        name: get(body, 'name'),
        description: get(body, 'description'),
        conditions: get(body, 'conditions'),
        actions: get(body, 'tagIds').map((tagId: string) => ({ tagId })),
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
          user: {
            id: 'usr_1',
            email: 'jane.doe@papra.app',
            name: 'Jane Doe',
          },
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
        name: get(body, 'name'),
        permissions: get(body, 'permissions'),
        organizationIds: get(body, 'organizationIds'),
        allOrganizations: get(body, 'allOrganizations'),
        expiresAt: get(body, 'expiresAt'),
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
        name: get(body, 'name'),
        url: get(body, 'url'),
        enabled: true,
        events: get(body, 'events'),
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
};

export const router = createRouter({ routes: inMemoryApiMock, strictTrailingSlash: false });
