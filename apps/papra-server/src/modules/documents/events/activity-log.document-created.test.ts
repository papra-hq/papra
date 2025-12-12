import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createEventServices } from '../../app/events/events.services';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { nextTick } from '../../shared/async/defer.test-utils';
import { createDeterministicIdGenerator } from '../../shared/random/ids';
import { createReadableStream } from '../../shared/streams/readable-stream';
import { createInMemoryTaskServices } from '../../tasks/tasks.test-utils';
import { documentActivityLogTable } from '../document-activity/document-activity.table';
import { createDocumentCreationUsecase } from '../documents.usecases';
import { inMemoryStorageDriverFactory } from '../storage/drivers/memory/memory.storage-driver';
import { registerInsertActivityLogOnDocumentCreatedHandler } from './activity-log.document-created';

describe('activity-log document-created', () => {
  describe('registerInsertActivityLogOnDocumentCreatedHandler', () => {
    test('when a document is created, a document activity log is registered', async () => {
      const taskServices = createInMemoryTaskServices();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = overrideConfig({
        organizationPlans: { isFreePlanUnlimited: true },
      });

      const eventServices = createEventServices({ logger: createNoopLogger() });
      registerInsertActivityLogOnDocumentCreatedHandler({ eventServices, db });

      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        generateDocumentId: createDeterministicIdGenerator({ prefix: 'doc' }),
        documentsStorageService: inMemoryStorageDriverFactory(),
        taskServices,
        eventServices,
      });

      await createDocument({
        fileStream: createReadableStream({ content: 'content-1' }),
        fileName: 'file.txt',
        mimeType: 'text/plain',
        userId: 'user-1',
        organizationId: 'organization-1',
      });

      await createDocument({
        fileStream: createReadableStream({ content: 'content-2' }),
        fileName: 'file.txt',
        mimeType: 'text/plain',
        organizationId: 'organization-1',
      });

      await nextTick();

      const documentActivityLogRecords = await db.select().from(documentActivityLogTable);

      expect(documentActivityLogRecords.length).to.eql(2);

      expect(documentActivityLogRecords[0]).to.deep.include({
        event: 'created',
        eventData: null,
        userId: 'user-1',
        documentId: 'doc_000000000000000000000001',
      });

      expect(documentActivityLogRecords[1]).to.deep.include({
        event: 'created',
        eventData: null,
        userId: null,
        documentId: 'doc_000000000000000000000002',
      });
    });
  });
});
