import type { ApiKey } from '../api-keys/api-keys.types';
import type { Document } from '../documents/documents.types';
import type { Organization } from '../organizations/organizations.types';
import type { TaggingRule } from '../tagging-rules/tagging-rules.types';
import type { Tag } from '../tags/tags.types';
import type { Webhook } from '../webhooks/webhooks.types';
import { createStorage, prefixStorage } from 'unstorage';
import localStorageDriver from 'unstorage/drivers/localstorage';
import { trackingServices } from '../tracking/tracking.services';

const storage = createStorage<any>({
  driver: localStorageDriver({ base: 'demo:' }),
});

export const organizationStorage = prefixStorage<Organization>(storage, 'organizations');
export const documentStorage = prefixStorage<Document>(storage, 'documents');
export const documentFileStorage = prefixStorage(storage, 'documentFiles');
export const tagStorage = prefixStorage<Omit<Tag, 'documentsCount'>>(storage, 'tags');
export const tagDocumentStorage = prefixStorage<{ documentId: string; tagId: string; id: string }>(storage, 'tagDocuments');
export const taggingRuleStorage = prefixStorage<TaggingRule>(storage, 'taggingRules');
export const apiKeyStorage = prefixStorage<ApiKey>(storage, 'apiKeys');
export const webhooksStorage = prefixStorage<Webhook>(storage, 'webhooks');

export async function clearDemoStorage() {
  await storage.clear();
  trackingServices.capture({ event: 'Demo storage cleared' });
}
