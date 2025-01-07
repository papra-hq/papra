import type { Document } from '../documents/documents.types';
import type { Organization } from '../organizations/organizations.types';
import { createStorage, prefixStorage } from 'unstorage';
import localStorageDriver from 'unstorage/drivers/localstorage';

const storage = createStorage<any>({
  driver: localStorageDriver({ base: 'demo:' }),
});

export const organizationStorage = prefixStorage<Organization>(storage, 'organizations');
export const documentStorage = prefixStorage<Document>(storage, 'documents');
export const documentFileStorage = prefixStorage(storage, 'documentFiles');

export async function clearDemoStorage() {
  await storage.clear();
}
