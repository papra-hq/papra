import type { FsNative } from '../shared/fs/fs.services';
import { safely } from '@corentinth/chisels';
import { memfs } from 'memfs';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { documentsTable } from '../documents/documents.table';
import { createDocumentCreationUsecase } from '../documents/documents.usecases';
import { inMemoryStorageDriverFactory } from '../documents/storage/drivers/memory/memory.storage-driver';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { createInMemoryFsServices } from '../shared/fs/fs.in-memory';
import { createFsServices } from '../shared/fs/fs.services';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createInvalidPostProcessingStrategyError } from './ingestion-folders.errors';
import { moveIngestionFile, processFile } from './ingestion-folders.usecases';

describe('ingestion-folders usecases', () => {
  describe('processFile', () => {
    describe('when a file is added to an organization ingestion folder', () => {
      test('if the post processing strategy is set to "move", the file is ingested and moved to the done folder', async () => {
        const { logger, getLogs } = createTestLogger();

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              strategy: 'move',
              moveToFolderPath: 'done',
            },
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const documentsStorageService = await inMemoryStorageDriverFactory();
        let documentIdIndex = 1;
        const generateDocumentId = () => `doc_${documentIdIndex++}`;

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: await createDocumentCreationUsecase({ db, config, logger, documentsStorageService, generateDocumentId }),
        });

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(1);
        expect(documents[0]).to.deep.include({
          id: 'doc_1',
          organizationId: 'org_111111111111111111111111',
          createdBy: null,
          name: 'hello.md',
          originalName: 'hello.md',
          originalSize: 11,
        });

        // Check file storage
        const files = Array.from(documentsStorageService._getStorage().values());

        expect(files).to.have.length(1);

        const [file] = files as [File];

        expect(file.name).to.equal('hello.md');
        expect(file.size).to.equal(11);
        expect(file.type).to.equal('text/markdown');
        expect(await file.text()).to.equal('lorem ipsum');

        // Check FS, ensure the file has been moved to the done folder
        expect(vol.toJSON()).to.deep.equal({
          '/apps/papra/ingestion/org_111111111111111111111111/done/hello.md': 'lorem ipsum',
        });

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                documentId: 'doc_1',
                organizationId: 'org_111111111111111111111111',
                userId: undefined,
              },
              level: 'info',
              message: 'Document created',
              namespace: 'test',
            },
            {
              data: {
                documentId: 'doc_1',
              },
              level: 'info',
              message: 'Document imported from ingestion folder',
              namespace: 'test',
            },
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'info',
              message: 'File moved after ingestion',
              namespace: 'test',
            },
          ],
        );
      });

      test('if the post processing strategy is set to "delete", the file is ingested and deleted', async () => {
        const { logger, getLogs } = createTestLogger();

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              strategy: 'delete',
            },
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const documentsStorageService = await inMemoryStorageDriverFactory();
        let documentIdIndex = 1;
        const generateDocumentId = () => `doc_${documentIdIndex++}`;

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: await createDocumentCreationUsecase({ db, config, logger, documentsStorageService, generateDocumentId }),
        });

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(1);
        expect(documents[0]).to.deep.include({
          id: 'doc_1',
          organizationId: 'org_111111111111111111111111',
          createdBy: null,
          name: 'hello.md',
          originalName: 'hello.md',
          originalSize: 11,
        });

        // Check file storage
        const files = Array.from(documentsStorageService._getStorage().values());

        expect(files).to.have.length(1);

        const [file] = files as [File];

        expect(file.name).to.equal('hello.md');
        expect(file.size).to.equal(11);
        expect(file.type).to.equal('text/markdown');
        expect(await file.text()).to.equal('lorem ipsum');

        // Check FS, ensure the file has been moved to the done folder
        expect(vol.toJSON()).to.deep.equal({
          '/apps/papra/ingestion/org_111111111111111111111111': null,
        });

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                documentId: 'doc_1',
                organizationId: 'org_111111111111111111111111',
                userId: undefined,
              },
              level: 'info',
              message: 'Document created',
              namespace: 'test',
            },
            {
              data: {
                documentId: 'doc_1',
              },
              level: 'info',
              message: 'Document imported from ingestion folder',
              namespace: 'test',
            },
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'info',
              message: 'File deleted after ingestion',
              namespace: 'test',
            },
          ],
        );
      });

      test('if the post processing strategy is not implemented, an error is thrown after the file has been ingested', async () => {
        const { logger } = createTestLogger();

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              // eslint-disable-next-line ts/no-unsafe-assignment
              strategy: 'unknown' as any,
            },
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const documentsStorageService = await inMemoryStorageDriverFactory();
        let documentIdIndex = 1;
        const generateDocumentId = () => `doc_${documentIdIndex++}`;

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        const [, error] = await safely(processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: await createDocumentCreationUsecase({ db, config, logger, documentsStorageService, generateDocumentId }),
        }));

        expect(error).to.deep.equal(createInvalidPostProcessingStrategyError({ strategy: 'unknown' }));

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(1);
        expect(documents[0]).to.deep.include({
          id: 'doc_1',
          organizationId: 'org_111111111111111111111111',
          createdBy: null,
          name: 'hello.md',
          originalName: 'hello.md',
          originalSize: 11,
        });

        // Check file storage
        const files = Array.from(documentsStorageService._getStorage().values());

        expect(files).to.have.length(1);

        const [file] = files as [File];

        expect(file.name).to.equal('hello.md');
        expect(file.size).to.equal(11);
        expect(file.type).to.equal('text/markdown');
        expect(await file.text()).to.equal('lorem ipsum');

        // Check FS, ensure the file is still in the ingestion folder
        expect(vol.toJSON()).to.deep.equal({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });
      });

      test('if for some reason the file cannot be read, a log is emitted and the processing stops', async () => {
        const { logger, getLogs } = createTestLogger();

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              // eslint-disable-next-line ts/no-unsafe-assignment
              strategy: 'unknown' as any,
            },
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const documentsStorageService = await inMemoryStorageDriverFactory();
        let documentIdIndex = 1;
        const generateDocumentId = () => `doc_${documentIdIndex++}`;

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: {
            ...createFsServices({ fs: vol.promises as unknown as FsNative }),
            readFile: async () => {
              throw new Error('File not found');
            },
          },
          createDocument: await createDocumentCreationUsecase({ db, config, logger, documentsStorageService, generateDocumentId }),
        });

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                error: new Error('File not found'),
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'error',
              message: 'Error reading file',
              namespace: 'test',
            },
          ],
        );

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(0);
      });

      test('if a file is located in the post-processed "done" folder or "error" folder, it is not processed nor ingested', async () => {
        const { logger, getLogs } = createTestLogger();

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              strategy: 'move',
              moveToFolderPath: 'done',
            },
            errorFolder: 'error',
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/done/hello.md': 'lorem ipsum',
          '/apps/papra/ingestion/org_111111111111111111111111/error/world.md': 'dolor sit amet',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/done/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: async () => expect.fail('Document should not be created'),
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/error/world.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: async () => expect.fail('Document should not be created'),
        });

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(0);

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/done/hello.md',
              },
              level: 'debug',
              message: 'File from post-processing folder, skipping',
              namespace: 'test',
            },
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/error/world.md',
              },
              level: 'debug',
              message: 'File from error folder, skipping',
              namespace: 'test',
            },
          ],
        );
      });

      test('when the document already exists in the database, it is not ingested, but the post-processing is still executed', async () => {
        const { logger, getLogs } = createTestLogger();

        // This is the sha256 hash of the "lorem ipsum" text
        const loremIpsumSha256Hash = '5e2bf57d3f40c4b6df69daf1936cb766f832374b4fc0259a7cbff06e2f70f269';

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
          documents: [{ id: 'doc_1', organizationId: 'org_111111111111111111111111', name: 'hello.md', originalName: 'hello.md', originalStorageKey: 'hello.md', originalSha256Hash: loremIpsumSha256Hash, mimeType: 'text/markdown' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const documentsStorageService = await inMemoryStorageDriverFactory();
        let documentIdIndex = 1;
        const generateDocumentId = () => `doc_${documentIdIndex++}`;

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              strategy: 'move',
              moveToFolderPath: 'done',
            },
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: await createDocumentCreationUsecase({ db, config, logger, documentsStorageService, generateDocumentId }),
        });

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(1);
        expect(documents[0]?.id).to.equal('doc_1');

        // Check fs
        expect(vol.toJSON()).to.deep.equal({
          '/apps/papra/ingestion/org_111111111111111111111111/done/hello.md': 'lorem ipsum',
        });

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'info',
              message: 'Document not inserted because it already exists',
              namespace: 'test',
            },
            {
              data: {
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'info',
              message: 'File moved after ingestion',
              namespace: 'test',
            },
          ],
        );
      });

      test('when their is an issue with the document creation, the file is moved to the error folder', async () => {
        const { logger, getLogs } = createTestLogger();

        // This is the sha256 hash of the "lorem ipsum" text
        const loremIpsumSha256Hash = '5e2bf57d3f40c4b6df69daf1936cb766f832374b4fc0259a7cbff06e2f70f269';

        const { db } = await createInMemoryDatabase({
          organizations: [{ id: 'org_111111111111111111111111', name: 'Org 1' }],
          documents: [{ id: 'doc_1', organizationId: 'org_111111111111111111111111', name: 'hello.md', originalName: 'hello.md', originalStorageKey: 'hello.md', originalSha256Hash: loremIpsumSha256Hash, mimeType: 'text/markdown' }],
        });
        const organizationsRepository = createOrganizationsRepository({ db });

        const config = overrideConfig({
          ingestionFolder: {
            folderRootPath: '/apps/papra/ingestion',
            postProcessing: {
              strategy: 'move',
              moveToFolderPath: 'done',
            },
            errorFolder: 'error',
          },
          documentsStorage: {
            driver: 'in-memory',
          },
        });

        const { vol } = memfs({
          '/apps/papra/ingestion/org_111111111111111111111111/hello.md': 'lorem ipsum',
        });

        await processFile({
          filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
          ingestionFolderPath: '/apps/papra/ingestion',
          config,
          organizationsRepository,
          logger,
          fs: createFsServices({ fs: vol.promises as unknown as FsNative }),
          createDocument: async () => {
            throw new Error('Document creation failed');
          },
        });

        // Check database
        const documents = await db.select().from(documentsTable);

        expect(documents).to.have.length(1);
        expect(documents[0]?.id).to.equal('doc_1');

        // Check fs
        expect(vol.toJSON()).to.deep.equal({
          '/apps/papra/ingestion/org_111111111111111111111111/error/hello.md': 'lorem ipsum',
        });

        // Check logs
        expect(getLogs({ excludeTimestampMs: true })).to.eql(
          [
            {
              data: {
                error: new Error('Document creation failed'),
                filePath: '/apps/papra/ingestion/org_111111111111111111111111/hello.md',
              },
              level: 'error',
              message: 'Error creating document',
              namespace: 'test',
            },
          ],
        );
      });
    });
  });

  describe('moveIngestionFile', () => {
    describe(`a file from the ingestion folder can be moved
              - either to the done folder, when the post-processing strategy is set to "move"
              - or to the error folder, when an error occurs during the ingestion
              so this can lead to data loss if not handled properly`, () => {
      test('in best case, the file is moved to the destination folder', async () => {
        const { fs, getFsState } = createInMemoryFsServices({
          '/apps/hello.md': 'lorem ipsum',
        });

        await moveIngestionFile({
          filePath: '/apps/hello.md',
          moveToFolder: '/foo/destination',
          fs,
        });

        expect(getFsState()).to.deep.equal({
          '/apps': null,
          '/foo/destination/hello.md': 'lorem ipsum',
        });
      });

      test('if the destination file already exists, but has the same name and same content, the original file is deleted', async () => {
        const { fs, getFsState } = createInMemoryFsServices({
          '/apps/hello.md': 'lorem ipsum',
          '/foo/destination/hello.md': 'lorem ipsum',
        });

        await moveIngestionFile({
          filePath: '/apps/hello.md',
          moveToFolder: '/foo/destination',
          fs,
        });

        expect(getFsState()).to.deep.equal({
          '/apps': null,
          '/foo/destination/hello.md': 'lorem ipsum',
        });
      });

      test('if the destination file already exists, but has the same name and different content, the original file is renamed with a timestamp', async () => {
        const { fs, getFsState } = createInMemoryFsServices({
          '/apps/hello.md': 'lorem ipsum',
          '/foo/destination/hello.md': 'dolor sit amet',
        });

        await moveIngestionFile({
          filePath: '/apps/hello.md',
          moveToFolder: '/foo/destination',
          fs,
          now: new Date('2021-01-01'),
        });

        expect(getFsState()).to.deep.equal({
          '/apps': null,
          '/foo/destination/hello.md': 'dolor sit amet',
          '/foo/destination/hello_1609459200000.md': 'lorem ipsum',
        });
      });
    });
  });
});
