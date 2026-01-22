import type { ApiKey } from '../api-keys/api-keys.types';
import type { Document } from '../documents/documents.types';
import type { Organization } from '../organizations/organizations.types';
import type { TaggingRule } from '../tagging-rules/tagging-rules.types';
import type { Tag } from '../tags/tags.types';
import type { Webhook } from '../webhooks/webhooks.types';
import { createStorage, prefixStorage } from 'unstorage';
import localStorageDriver from 'unstorage/drivers/localstorage';
import { trackingServices } from '../tracking/tracking.services';
import { DEMO_IS_SEEDED_KEY } from './demo.constants';
import { createId } from './demo.models';
import { documentFixtures } from './seed/documents.fixtures';
import { tagsFixtures } from './seed/tags.fixtures';

const storage = createStorage<any>({
  driver: localStorageDriver({ base: 'demo:' }),
});

export type DocumentFileStoredFile = { name: string; size: number; type: string; base64Content: string };
export type DocumentFileRemoteFile = { name: string; path: string };
export type DocumentFile = DocumentFileStoredFile | DocumentFileRemoteFile;

export const organizationStorage = prefixStorage<Organization>(storage, 'organizations');
export const documentStorage = prefixStorage<Document>(storage, 'documents');
export const documentFileStorage = prefixStorage<DocumentFile>(storage, 'documentFiles');
export const tagStorage = prefixStorage<Omit<Tag, 'documentsCount'>>(storage, 'tags');
export const tagDocumentStorage = prefixStorage<{ documentId: string; tagId: string; id: string }>(storage, 'tagDocuments');
export const taggingRuleStorage = prefixStorage<TaggingRule>(storage, 'taggingRules');
export const apiKeyStorage = prefixStorage<ApiKey>(storage, 'apiKeys');
export const webhooksStorage = prefixStorage<Webhook>(storage, 'webhooks');

export async function clearDemoStorage() {
  await storage.clear();
  localStorage.removeItem(DEMO_IS_SEEDED_KEY);
  trackingServices.capture({ event: 'Demo storage cleared' });
}

// Simple in-memory lock to prevent concurrent seeding
let seedingPromise: Promise<void> | null = null;

export async function ensureDemoStorageSeeded() {
  // If already seeded, return immediately
  if (localStorage.getItem(DEMO_IS_SEEDED_KEY)) {
    return;
  }

  // If seeding is in progress, wait for it
  if (seedingPromise) {
    return seedingPromise;
  }

  await clearDemoStorage();

  // Start seeding
  seedingPromise = seedDemoStorage()
    .then(() => {
      localStorage.setItem(DEMO_IS_SEEDED_KEY, 'true');
    })
    .finally(() => {
      seedingPromise = null;
    });

  return seedingPromise;
}

const idTuple = <T extends { id: string }>(item: T): [string, T] => [item.id, item];

export async function seedDemoStorage() {
  const organizationId = 'org_1GAP1Miap135XEcbKuBQF948'; // hard coded for better navigation on reset
  const now = new Date('2026-01-20T00:00:00Z');
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Create default organization
  await organizationStorage.setItem(...idTuple({
    id: organizationId,
    name: 'My organization',
    createdAt: lastMonth,
    updatedAt: lastMonth,
  }));

  const tags = tagsFixtures.map(tag => ({
    id: createId({ prefix: 'tag' }),
    organizationId,
    name: tag.name,
    color: tag.color,
    description: tag.description,
    createdAt: lastMonth,
    updatedAt: lastMonth,
  }));

  const tagsPromises = tagStorage.setItems(tags.map(tag => ({ key: tag.id, value: tag })));

  const documentsPromises = documentFixtures.flatMap((fixture) => {
    const documentId = createId({ prefix: 'doc' });

    const key = `${organizationId}:${documentId}`;

    const documentPromise = documentStorage.setItem(key, {
      id: documentId,
      organizationId,
      name: fixture.name,
      mimeType: fixture.mimeType,
      content: fixture.content,
      originalSize: fixture.size,
      createdAt: fixture.date,
      updatedAt: fixture.date,
      tags: [],
    });

    const documentFilePromise = documentFileStorage.setItem(`${organizationId}:${documentId}`, { path: fixture.fileUrl, name: fixture.name });

    const tagIds = tags
      .filter(tag => fixture.tags.includes(tag.name))
      .map(tag => tag.id);

    const tagDocumentPromise = tagDocumentStorage.setItems(tagIds.map((tagId) => {
      const id = createId({ prefix: 'tagdoc' });

      return {
        key: id,
        value: {
          id,
          documentId,
          tagId,
        },
      };
    }));

    return [documentPromise, documentFilePromise, tagDocumentPromise];
  });

  await Promise.all([
    tagsPromises,
    ...documentsPromises,
  ]);
}
