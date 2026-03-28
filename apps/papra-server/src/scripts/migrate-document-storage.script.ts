import type { Database } from '../modules/app/database/database.types';
import process from 'node:process';
import { parseArgs, parseEnv } from 'node:util';
import * as p from '@clack/prompts';
import { castError } from '@corentinth/chisels';
import { createNoopLogger } from '@crowlog/logger';
import { count, eq } from 'drizzle-orm';
import { createIterator } from '../modules/app/database/database.usecases';
import { parseConfig } from '../modules/config/config';
import { documentsTable } from '../modules/documents/documents.table';
import { createStorageKey } from '../modules/documents/storage/document-storage.usecases';
import { createDocumentStorageService } from '../modules/documents/storage/documents.storage.services';
import { organizationsTable } from '../modules/organizations/organizations.table';
import { ensureBooleanArg } from './commons/args.utils';
import { runScriptWithDb } from './commons/run-script';

const envArgsToString = (args: (string | boolean)[] = []) => args.filter(arg => typeof arg === 'string').join('\n');

export async function migrateDocumentStorage({
  db,
  fromEnv,
  toEnv,
  deleteSource,
  isDryRun,
  prompts,
}: {
  db: Database;
  fromEnv: Record<string, string>;
  toEnv: Record<string, string>;
  deleteSource: boolean;
  isDryRun: boolean;
  prompts?: typeof p;
}) {
  const { config: fromConfig } = await parseConfig({ env: { ...process.env, ...fromEnv } });
  const { config: toConfig } = await parseConfig({ env: { ...process.env, ...toEnv } });

  const fromStorageService = createDocumentStorageService({ documentStorageConfig: fromConfig.documentsStorage });
  const toStorageService = createDocumentStorageService({ documentStorageConfig: toConfig.documentsStorage });

  prompts?.intro('Document Storage Migration');

  if (isDryRun) {
    prompts?.log.info('This is a dry run, no actual migration will be performed.\nJust logging the documents that would be migrated.');
  }

  const migrationErrors: { document: { id: string; originalName: string; originalStorageKey: string }; error: unknown }[] = [];

  const [{ count: documentCount = 0 } = {}] = await db.select({ count: count() }).from(documentsTable);

  if (documentCount === 0) {
    prompts?.outro('No documents found in the database, nothing to migrate');
    return;
  }

  prompts?.log.info(`Found ${documentCount} documents in the database`);

  const query = db
    .select({
      id: documentsTable.id,
      originalStorageKey: documentsTable.originalStorageKey,
      organizationId: documentsTable.organizationId,
      organizationName: organizationsTable.name,
      originalName: documentsTable.originalName,
      mimeType: documentsTable.mimeType,
      fileEncryptionKeyWrapped: documentsTable.fileEncryptionKeyWrapped,
      fileEncryptionKekVersion: documentsTable.fileEncryptionKekVersion,
      fileEncryptionAlgorithm: documentsTable.fileEncryptionAlgorithm,
    })
    .from(documentsTable)
    .innerJoin(organizationsTable, eq(documentsTable.organizationId, organizationsTable.id))
    .$dynamic();

  const documentIterator = createIterator({ query });

  const progress = prompts?.progress({
    style: 'heavy',
    max: documentCount,
  });

  progress?.start();

  for await (const document of documentIterator) {
    const {
      id,
      originalStorageKey: storageKey,
      organizationId,
      organizationName,
      originalName,
      mimeType,
      fileEncryptionKeyWrapped,
      fileEncryptionKekVersion,
      fileEncryptionAlgorithm,
    } = document;

    progress?.message(`Migrating ${originalName} - ${storageKey}`);

    if (isDryRun) {
      await new Promise(resolve => setTimeout(resolve, 10));
      progress?.advance();
      continue;
    }

    try {
      const { fileStream } = await fromStorageService.getFileStream({
        storageKey,
        fileEncryptionKeyWrapped,
        fileEncryptionKekVersion,
        fileEncryptionAlgorithm,
      });

      const { storageKey: newStorageKey } = await createStorageKey({
        storagePatternConfig: toConfig.documentsStorage.pattern,
        documentId: id,
        organizationId,
        organizationName,
        documentName: originalName,
        documentsStorageService: toStorageService,
        logger: createNoopLogger(),
      });

      const encryptionFields = await toStorageService.saveFile({
        fileStream,
        fileName: originalName,
        mimeType,
        storageKey: newStorageKey,
      });

      await db
        .update(documentsTable)
        .set({
          originalStorageKey: newStorageKey,
          fileEncryptionKeyWrapped: encryptionFields.fileEncryptionKeyWrapped,
          fileEncryptionKekVersion: encryptionFields.fileEncryptionKekVersion,
          fileEncryptionAlgorithm: encryptionFields.fileEncryptionAlgorithm,
        })
        .where(eq(documentsTable.id, id));

      if (deleteSource) {
        await fromStorageService.deleteFile({ storageKey });
      }
    } catch (error) {
      migrationErrors.push({ document, error });
    }

    progress?.advance();
  }

  progress?.stop(`Migration completed: ${documentCount - migrationErrors.length} succeeded, ${migrationErrors.length} failed.`);

  if (migrationErrors.length > 0) {
    migrationErrors.forEach(({ document, error }) => {
      const { id, originalName, originalStorageKey } = document;
      prompts?.log.error(`- Document ID: ${id}, Name: ${originalName}, Storage Key: ${originalStorageKey}\n  Error: ${castError(error).message}`);
    });
  }
}

await runScriptWithDb(
  { scriptName: 'migrate-document-storage', silent: true },
  async ({ db }) => {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'from': { type: 'string', multiple: true, default: [] },
        'to': { type: 'string', multiple: true, default: [] },
        'delete-source': { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        'help': { type: 'boolean', short: 'h', default: false },
      },
      strict: false,
    });

    if (ensureBooleanArg(values.help)) {
      console.log(`
Usage: migrate-document-storage [options]

Options:
  --from <env>        Source environment variables (can be specified multiple times)
  --to <env>          Destination environment variables (can be specified multiple times)
  --delete-source     Delete source file after successful migration (backup recommended)
  --dry-run           Perform a dry run without actual migration, just logs
  -h, --help          Show this help message
      `);
      process.exit(0);
    }

    const fromEnv = parseEnv(envArgsToString(values.from)) as Record<string, string>;
    const toEnv = parseEnv(envArgsToString(values.to)) as Record<string, string>;
    const deleteSource = ensureBooleanArg(values['delete-source']);
    const isDryRun = ensureBooleanArg(values['dry-run']);

    await migrateDocumentStorage({
      db,
      fromEnv,
      toEnv,
      deleteSource,
      isDryRun,
      prompts: p,
    });
  },
);
