import type { Stats } from 'node:fs';
import type { Database } from '../app/database/database.types';
import type { EventServices } from '../app/events/events.services';
import type { Config } from '../config/config.types';
import type { CreateDocumentUsecase } from '../documents/documents.usecases';
import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { FsServices } from '../shared/fs/fs.services';
import type { Logger } from '../shared/logger/logger';
import type { TaskServices } from '../tasks/tasks.services';
import { isAbsolute, join, parse } from 'node:path';
import { safely, safelySync } from '@corentinth/chisels';
import chokidar from 'chokidar';
import PQueue from 'p-queue';
import picomatch from 'picomatch';
import { DOCUMENT_ALREADY_EXISTS_ERROR_CODE } from '../documents/documents.errors';
import { createDocumentCreationUsecase } from '../documents/documents.usecases';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { isErrorWithCode } from '../shared/errors/errors';
import { createFsServices } from '../shared/fs/fs.services';
import { createLogger } from '../shared/logger/logger';
import { getRootDirPath } from '../shared/path';
import { isNil, uniq } from '../shared/utils';
import {
  addTimestampToFilename,
  getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder,
  getOrganizationIdFromFilePath,
  isFileInDoneFolder,
  isFileInErrorFolder,
  normalizeFilePathToIngestionFolder,
} from './ingestion-folder.models';
import { createInvalidPostProcessingStrategyError } from './ingestion-folders.errors';
import { getFile } from './ingestion-folders.services';

export function createIngestionFolderWatcher({
  config,
  logger = createLogger({ namespace: 'ingestion-folder-watcher' }),
  db,
  taskServices,
  documentsStorageService,
  eventServices,
}: {
  config: Config;
  logger?: Logger;
  db: Database;
  taskServices: TaskServices;
  documentsStorageService: DocumentStorageService;
  eventServices: EventServices;
}) {
  const {
    folderRootPath,
    watcher: {
      usePolling,
      pollingInterval,
      awaitWriteFinish: { stabilityThreshold, pollInterval },
    },
    processingConcurrency,
  } = config.ingestionFolder;

  const processingQueue = new PQueue({ concurrency: processingConcurrency });
  const cwd = getRootDirPath();
  const ingestionFolderPath = isAbsolute(folderRootPath)
    ? folderRootPath
    : join(cwd, folderRootPath);

  return {
    startWatchingIngestionFolders: async () => {
      const organizationsRepository = createOrganizationsRepository({ db });
      const createDocument = createDocumentCreationUsecase({
        db,
        config,
        logger,
        taskServices,
        documentsStorageService,
        eventServices,
      });

      const ignored = await buildPathIgnoreFunction({ config, cwd, organizationsRepository });

      chokidar
        .watch(folderRootPath, {
          persistent: true,
          followSymlinks: true,
          awaitWriteFinish: {
            stabilityThreshold,
            pollInterval,
          },
          atomic: true,
          cwd,
          usePolling,
          interval: pollingInterval,
          ignored,
        })
        .on('add', async (fileMaybeCwdRelativePath) => {
          await processingQueue.add(async () => {
            const filePath = isAbsolute(fileMaybeCwdRelativePath)
              ? fileMaybeCwdRelativePath
              : join(cwd, fileMaybeCwdRelativePath);

            logger.info({ filePath }, 'Processing file');

            const [, error] = await safely(
              processFile({
                filePath,
                ingestionFolderPath,
                createDocument,
                logger,
                config,
                organizationsRepository,
              }),
            );

            if (error) {
              logger.error({ filePath, error }, 'Error processing file');
            }
          });
        });

      logger.info(
        {
          folderRootPath,
          usePolling,
          pollingInterval,
          stabilityThreshold,
          pollInterval,
          processingConcurrency,
        },
        'Ingestion folder watcher started',
      );
    },
  };
}

export async function processFile({
  filePath,
  ingestionFolderPath,
  logger,
  organizationsRepository,
  config,
  createDocument,
  fs = createFsServices(),
}: {
  filePath: string;
  ingestionFolderPath: string;
  logger: Logger;
  config: Config;
  createDocument: CreateDocumentUsecase;
  organizationsRepository: OrganizationsRepository;
  fs?: FsServices;
}) {
  const {
    postProcessing: { moveToFolderPath: doneFolder },
    errorFolder,
  } = config.ingestionFolder;

  const { organizationId } = await getFileOrganizationId({
    filePath,
    ingestionFolderPath,
    organizationsRepository,
  });

  if (isNil(organizationId)) {
    logger.warn(
      { filePath },
      'A file in the ingestion folder is not located in an organization ingestion folder, skipping',
    );
    return;
  }

  const organizationIngestionFolderPath = join(ingestionFolderPath, organizationId);

  if (isFileInDoneFolder({ filePath, doneFolder, organizationIngestionFolderPath })) {
    logger.debug({ filePath }, 'File from post-processing folder, skipping');
    return;
  }

  if (isFileInErrorFolder({ filePath, errorFolder, organizationIngestionFolderPath })) {
    logger.debug({ filePath }, 'File from error folder, skipping');
    return;
  }

  let result;
  let error: any;
  let isReadFileError = false;
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const [getFileResult, getFileError] = safelySync(() => getFile({ filePath, fs }));

    if (getFileError) {
      error = getFileError;
      isReadFileError = true;
      const isRetryable =
        getFileError.code === 'EIO' ||
        getFileError.code === 'EBUSY' ||
        getFileError.code === 'ENOENT' ||
        getFileError.message?.includes('EIO') ||
        getFileError.message?.includes('EBUSY');

      if (isRetryable && attempt < maxAttempts) {
        logger.warn(
          { filePath, error: getFileError, attempt },
          'Error reading file from ingestion folder, retrying...',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      break;
    }

    isReadFileError = false;
    const { fileStream, mimeType, fileName } = getFileResult;

    // TODO: switch to native stream
    const [createResult, createError] = await safely(
      createDocument({
        fileStream,
        fileName,
        mimeType,
        organizationId,
      }),
    );

    result = createResult;
    error = createError;

    if (error) {
      const isNotInsertedBecauseAlreadyExists = isErrorWithCode({
        error,
        code: DOCUMENT_ALREADY_EXISTS_ERROR_CODE,
      });

      if (isNotInsertedBecauseAlreadyExists) {
        break;
      }

      const isRetryable =
        error.code === 'EIO' ||
        error.code === 'EBUSY' ||
        error.code === 'ENOENT' ||
        error.message?.includes('EIO') ||
        error.message?.includes('EBUSY');

      if (isRetryable && attempt < maxAttempts) {
        logger.warn(
          { filePath, error, attempt },
          'Error creating document from ingestion folder (retryable), retrying...',
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }

    break;
  }

  if (error) {
    if (isReadFileError) {
      logger.error({ filePath, error }, 'Error reading file');
      return;
    }

    const isNotInsertedBecauseAlreadyExists = isErrorWithCode({
      error,
      code: DOCUMENT_ALREADY_EXISTS_ERROR_CODE,
    });

    if (!isNotInsertedBecauseAlreadyExists) {
      logger.error({ filePath, error }, 'Error creating document');
      const errorFolderPath = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({
        path: errorFolder,
        organizationIngestionFolderPath,
      });

      await moveIngestionFile({ filePath, moveToFolder: errorFolderPath, fs });
      return;
    }
  }

  const isNotInsertedBecauseAlreadyExists = isErrorWithCode({
    error,
    code: DOCUMENT_ALREADY_EXISTS_ERROR_CODE,
  });

  if (isNotInsertedBecauseAlreadyExists) {
    logger.info({ filePath }, 'Document not inserted because it already exists');
  }

  if (result?.document) {
    const { document } = result;

    logger.info({ documentId: document.id }, 'Document imported from ingestion folder');
  }

  await postProcessFile({ filePath, organizationIngestionFolderPath, logger, config, fs });
}

async function postProcessFile({
  filePath,
  organizationIngestionFolderPath,
  logger,
  config,
  fs = createFsServices(),
}: {
  filePath: string;
  organizationIngestionFolderPath: string;
  logger: Logger;
  config: Config;
  fs?: FsServices;
}) {
  const {
    postProcessing: { strategy, moveToFolderPath },
  } = config.ingestionFolder;

  if (strategy === 'delete') {
    await fs.deleteFile({ filePath });
    logger.info({ filePath }, 'File deleted after ingestion');
    return;
  }

  if (strategy === 'move') {
    const path = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({
      path: moveToFolderPath,
      organizationIngestionFolderPath,
    });

    await moveIngestionFile({ filePath, moveToFolder: path, fs });
    logger.info({ filePath }, 'File moved after ingestion');
    return;
  }

  throw createInvalidPostProcessingStrategyError({ strategy });
}

async function getFileOrganizationId({
  filePath,
  ingestionFolderPath,
  organizationsRepository,
}: {
  filePath: string;
  ingestionFolderPath: string;
  organizationsRepository: OrganizationsRepository;
}) {
  const { relativeFilePath } = normalizeFilePathToIngestionFolder({
    filePath,
    ingestionFolderPath,
  });

  const { organizationId } = getOrganizationIdFromFilePath({ relativeFilePath });

  if (isNil(organizationId)) {
    return { organizationId: undefined };
  }

  const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

  if (isNil(organization)) {
    return { organizationId: undefined };
  }

  return { organizationId: organization.id };
}

async function buildPathIgnoreFunction({
  config,
  cwd = getRootDirPath(),
  organizationsRepository,
}: {
  config: Config;
  cwd?: string;
  organizationsRepository: OrganizationsRepository;
}) {
  const {
    ingestionFolder: {
      postProcessing: { strategy, moveToFolderPath },
      errorFolder,
      ignoredPatterns,
      folderRootPath,
    },
  } = config;

  const { organizationIds } = await organizationsRepository.getAllOrganizationIds();

  const doneFolders =
    strategy === 'move'
      ? isAbsolute(moveToFolderPath)
        ? [moveToFolderPath]
        : uniq(organizationIds.map((id) => join(cwd, folderRootPath, id, moveToFolderPath)))
      : [];

  const errorFolders = isAbsolute(errorFolder)
    ? [errorFolder]
    : uniq(organizationIds.map((id) => join(cwd, folderRootPath, id, errorFolder)));

  const ignoredFolders = [...doneFolders, ...errorFolders];
  const matchExcludedPatterns = picomatch(ignoredPatterns);

  return (path: string, stats?: Stats) => {
    const normalizedPath = isAbsolute(path) ? path : join(cwd, path);

    return (
      Boolean(stats?.isFile()) &&
      (ignoredFolders.some((folder) => normalizedPath.startsWith(folder)) ||
        matchExcludedPatterns(normalizedPath))
    );
  };
}

export async function moveIngestionFile({
  filePath,
  moveToFolder,
  fs = createFsServices(),
  now = new Date(),
}: {
  filePath: string;
  moveToFolder: string;
  fs?: FsServices;
  now?: Date;
}) {
  const { base } = parse(filePath);
  const newFilePath = join(moveToFolder, base);

  await fs.ensureDirectoryExists({ path: moveToFolder });

  // Check if the destination file already exists
  const destinationFileExists = await fs.checkFileExists({ path: newFilePath });

  if (destinationFileExists) {
    // Check if the files have the same content
    const sameContent = await fs.areFilesContentIdentical({
      file1: filePath,
      file2: newFilePath,
    });

    if (sameContent) {
      // If same content, no need to move - just delete the source file
      await fs.deleteFile({ filePath });
      return;
    } else {
      // If different content, generate a new filename with timestamp
      const newFileName = addTimestampToFilename({ fileName: base, now });
      const timestampedFilePath = join(moveToFolder, newFileName);

      await fs.moveFile({ sourceFilePath: filePath, destinationFilePath: timestampedFilePath });
      return;
    }
  }

  // Default case: no conflict, simple move
  await fs.moveFile({ sourceFilePath: filePath, destinationFilePath: newFilePath });
}
