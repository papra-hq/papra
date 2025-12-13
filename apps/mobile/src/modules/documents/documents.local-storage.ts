import type { Document } from './documents.types';
import * as FileSystem from 'expo-file-system/legacy';
import { coerceDate } from '../api/api.models';
import { buildStorageKey } from '../lib/local-storage/local-storage.models';
import { storage } from '../lib/local-storage/local-storage.services';

const UNSYNCED_DOCUMENTS_KEY = buildStorageKey(['documents', 'unsynced']);

async function getUnsyncedDocuments(): Promise<Document[]> {
  const data = await storage.getItem(UNSYNCED_DOCUMENTS_KEY);
  if (data == null) {
    return [];
  }
  const parsed = JSON.parse(data) as Array<Omit<Document, 'createdAt'> & { createdAt: string }>;
  return parsed.map(doc => ({
    ...doc,
    createdAt: coerceDate(doc.createdAt).toISOString(),
  }));
}

async function saveUnsyncedDocuments(documents: Document[]): Promise<void> {
  await storage.setItem(UNSYNCED_DOCUMENTS_KEY, JSON.stringify(documents));
}

export const documentsLocalStorage = {
  async addUnsyncedDocument(document: Document): Promise<void> {
    const documents = await getUnsyncedDocuments();
    documents.push(document);
    await saveUnsyncedDocuments(documents);
  },

  async getUnsyncedDocuments(): Promise<Document[]> {
    return getUnsyncedDocuments();
  },

  async getUnsyncedDocumentsByOrganization(organizationId: string): Promise<Document[]> {
    const documents = await getUnsyncedDocuments();
    return documents.filter(doc => doc.organizationId === organizationId);
  },

  async removeUnsyncedDocument(documentId: string): Promise<void> {
    const documents = await getUnsyncedDocuments();
    const filtered = documents.filter(doc => doc.id !== documentId);
    await saveUnsyncedDocuments(filtered);
  },

  async deleteUnsyncedDocumentFile(documentId: string): Promise<void> {
    const documents = await getUnsyncedDocuments();
    const document = documents.find(doc => doc.id === documentId);
    if (document != null) {
      try {
        if (document.localUri != null) {
          await FileSystem.deleteAsync(document.localUri, { idempotent: true });
        }
      } catch (error) {
        console.error('Error deleting unsynced document file:', error);
      }
    }
  },
};
