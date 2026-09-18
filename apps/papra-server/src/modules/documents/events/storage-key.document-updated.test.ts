import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createEventServices } from '../../app/events/events.services';
import { overrideConfig } from '../../config/config.test-utils';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import { nextTick } from '../../shared/async/defer.test-utils';
import { createReadableStream } from '../../shared/streams/readable-stream';
import { createInMemoryStorageService } from '../../storage/storage.test-utils';
import { createDocumentsRepository } from '../documents.repository';
import { updateDocument } from '../documents.usecases';
import { registerSyncDocumentStorageKeyHandler } from './storage-key.document-updated';

async function setup({
  storageKeyPattern = '{{document.date | formatDate}}/{{document.name}}',
} = {}) {
  const { db } = await createInMemoryDatabase({
    organizations: [{ id: 'org_1', name: 'Organization' }],
  });
  const documentsRepository = createDocumentsRepository({ db });
  const documentsStorageService = createInMemoryStorageService();
  const eventServices = createEventServices({ logger: createNoopLogger() });
  const { document } = await documentsRepository.saveOrganizationDocument({
    id: 'doc_1',
    organizationId: 'org_1',
    name: 'invoice.pdf',
    originalName: 'invoice.pdf',
    originalStorageKey: 'old.pdf',
    originalSha256Hash: 'hash',
    mimeType: 'application/pdf',
  });
  await documentsStorageService.saveFile({
    storageKey: document.originalStorageKey,
    fileName: document.name,
    mimeType: document.mimeType,
    fileStream: createReadableStream({ content: 'document bytes' }),
  });
  registerSyncDocumentStorageKeyHandler({
    db,
    documentsStorageService,
    eventServices,
    config: overrideConfig({
      documentsStorage: {
        pattern: {
          isStorageKeySyncEnabled: true,
          useLegacyStorageKeyDefinitionSystem: false,
          storageKeyPattern,
        },
      },
    }),
  });

  const args = { documentId: document.id, organizationId: document.organizationId };
  return {
    renameOrganization: async (name: string) =>
      createOrganizationsRepository({ db }).updateOrganization({
        organizationId: document.organizationId,
        organization: { name },
      }),
    update: async (changes: Parameters<typeof updateDocument>[0]['changes']) =>
      updateDocument({ ...args, changes, documentsRepository, eventServices }),
    getStorageKey: async () =>
      (await documentsRepository.getDocumentById(args)).document?.originalStorageKey,
    keys: () => [...documentsStorageService._getStorage().keys()],
  };
}

describe('storage-key document.updated handler', () => {
  test('an organization rename keeps existing keys until a later qualifying document update', async () => {
    const { update, getStorageKey, keys, renameOrganization } = await setup({
      storageKeyPattern: '{{organization.name}}/{{document.name}}',
    });

    await update({ name: 'renamed.pdf' });
    await expect.poll(getStorageKey).toEqual('Organization/renamed.pdf');
    await expect.poll(keys).toEqual(['Organization/renamed.pdf']);

    await renameOrganization('New/Organization');
    await nextTick();

    expect(await getStorageKey()).toEqual('Organization/renamed.pdf');
    expect(keys()).toEqual(['Organization/renamed.pdf']);

    await update({ documentDate: new Date('2024-03-12T00:00:00.000Z') });
    await expect.poll(getStorageKey).toEqual('New_Organization/renamed.pdf');
    await expect.poll(keys).toEqual(['New_Organization/renamed.pdf']);
  });

  test('setting, changing, and clearing a document date move the file to the matching key', async () => {
    const { update, getStorageKey, keys } = await setup();

    await update({ documentDate: new Date('2024-03-12T00:00:00.000Z') });
    await expect.poll(getStorageKey).toEqual('2024-03-12/invoice.pdf');
    await expect.poll(keys).toEqual(['2024-03-12/invoice.pdf']);

    await update({ documentDate: new Date('2025-06-15T00:00:00.000Z') });
    await expect.poll(getStorageKey).toEqual('2025-06-15/invoice.pdf');
    await expect.poll(keys).toEqual(['2025-06-15/invoice.pdf']);

    await update({ documentDate: null });
    await expect.poll(getStorageKey).toEqual('no-date/invoice.pdf');
    await expect.poll(keys).toEqual(['no-date/invoice.pdf']);
  });

  test('content and notes updates do not synchronize the storage key', async () => {
    const { update, getStorageKey, keys } = await setup();

    await update({ content: 'updated content', notes: 'updated notes' });
    await nextTick();

    expect(await getStorageKey()).toEqual('old.pdf');
    expect(keys()).toEqual(['old.pdf']);
  });
});
