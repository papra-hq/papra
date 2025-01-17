import { get } from 'lodash-es';
import { FetchError } from 'ofetch';
import { createRouter } from 'radix3';
import { defineHandler } from './demo-api-mock.models';
import { documentFileStorage, documentStorage, organizationStorage } from './demo.storage';

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
    path: '/api/organizations',
    method: 'GET',
    handler: async () => {
      const keys = await organizationStorage.getKeys();
      const organizations = await Promise.all(keys.map(key => organizationStorage.getItem(key)));

      return { organizations };
    },
  }),

  ...defineHandler({
    path: '/api/organizations',
    method: 'POST',
    handler: async ({ body }) => {
      const organization = {
        id: `org_${Math.random().toString(36).slice(2)}`,
        name: get(body, 'name'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await organizationStorage.setItem(organization.id, organization);

      return { organization };
    },
  }),

  ...defineHandler({
    path: '/api/organizations/:organizationId/documents',
    method: 'GET',
    handler: async ({ params: { organizationId }, query }) => {
      const organization = organizationStorage.getItem(organizationId);
      assert(organization, { status: 403 });

      const allKeys = await documentStorage.getKeys();
      const keys = allKeys.filter(key => key.startsWith(organizationId));

      const documents = await Promise.all(keys.map(key => documentStorage.getItem(key)));

      const filteredDocuments = documents.filter(document => !document?.deletedAt);

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
        id: `doc_${Math.random().toString(36).slice(2)}`,
        organizationId,
        name: file.name,
        originalName: file.name,
        originalSize: file.size,
        mimeType: file.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const key = `${organizationId}:${document.id}`;

      await documentFileStorage.setItem(key, await serializeFile(file));
      await documentStorage.setItem(key, document);

      return { document };
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

      const allKeys = await documentStorage.getKeys();
      const keys = allKeys.filter(key => key.startsWith(organizationId));

      const documents = await Promise.all(keys.map(key => documentStorage.getItem(key)));

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

      const allKeys = await documentStorage.getKeys();
      const keys = allKeys.filter(key => key.startsWith(organizationId));

      const documents = await Promise.all(keys.map(key => documentStorage.getItem(key)));

      const deletedDocuments = documents.filter(document => document?.deletedAt);

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

      return { document };
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
    path: '/api/organizations/:organizationId',
    method: 'GET',
    handler: async ({ params: { organizationId } }) => {
      const organization = await organizationStorage.getItem(organizationId);

      assert(organization, { status: 403 });

      return {
        organization,
      };
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
};

export const router = createRouter({ routes: inMemoryApiMock, strictTrailingSlash: false });
