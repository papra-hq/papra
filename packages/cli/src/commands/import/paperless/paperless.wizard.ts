import type { Client } from '@papra/api-sdk';
import type JSZip from 'jszip';
import type { PaperlessDocumentItem, PaperlessTagItem } from './paperless.types';
import * as prompts from '@clack/prompts';
import { safely } from '@corentinth/chisels';
import mime from 'mime-types';
import pc from 'picocolors';
import { getErrorMessage } from '../../../errors/errors.models';
import { exit, exitOnCancel } from '../../../prompts/utils';
import { extractFileFromArchive, extractManifest, parseManifest, readArchive } from './paperless.usecases';

function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural ?? `${singular}s`}`;
}

type TagStrategy = 'create-and-map' | 'create-all' | 'skip';
type DocumentStrategy = 'import-with-tags' | 'import-without-tags' | 'skip';

type ExportAnalysis = {
  documentCount: number;
  tagCount: number;
};

type TagAnalysis = {
  existingTags: Array<{ id: string; name: string }>;
  missingTags: PaperlessTagItem[];
  tagMapping: Map<number, string>;
};

type ImportStats = {
  documentsImported: number;
  documentsSkipped: number;
  documentsFailed: number;
  tagsCreated: number;
  errors: Array<{ fileName: string; error: string }>;
};

export async function analyzeExport({ archivePath }: { archivePath: string }): Promise<{
  manifest: Awaited<ReturnType<typeof extractManifest>>;
  analysis: ExportAnalysis;
}> {
  const [manifest, error] = await safely(extractManifest({ archivePath }));

  if (error) {
    exit(`Failed to extract manifest:\n${getErrorMessage(error)}`);
  }

  if (!manifest) {
    exit('Failed to extract manifest');
  }

  const preview = parseManifest({ manifest });

  const analysis: ExportAnalysis = {
    documentCount: preview.documents.length,
    tagCount: preview.tags.length,
  };

  prompts.note(
    [
      `${pc.green('✓')} Valid Paperless NGX export detected`,
      `${pc.green('✓')} Found ${pluralize(analysis.documentCount, 'document')}`,
      `${pc.green('✓')} Found ${pluralize(analysis.tagCount, 'tag')}`,
    ].join('\n'),
    'Export file analysis',
  );

  return { manifest, analysis };
}

export async function analyzeAndHandleTags({
  manifest,
  organizationId,
  apiClient,
}: {
  manifest: Awaited<ReturnType<typeof extractManifest>>;
  organizationId: string;
  apiClient: Client;
}): Promise<TagAnalysis> {
  const preview = parseManifest({ manifest });

  const { tags: existingTags } = await apiClient.listTags({ organizationId });
  const missingTags = preview.tags.filter(
    tag => !existingTags.some(existingTag => existingTag.name === tag.fields.name),
  );

  prompts.note(
    preview.tags.length === 0
      ? 'No tags found in export'
      : [
          `${pluralize(preview.tags.length, 'tag')} found in export`,
          ` - ${pluralize(existingTags.length, 'tag')} have the same name in the Papra organization`,
          ` - ${pluralize(missingTags.length, 'tag')} need to be created`,
        ].join('\n'),
    'Tags analysis',
  );

  if (preview.tags.length === 0) {
    return {
      existingTags,
      missingTags: [],
      tagMapping: new Map(),
    };
  }

  const tagStrategy = await selectTagStrategy({ hasMissingTags: missingTags.length > 0 });

  const tagMapping = await executeTagStrategy({
    strategy: tagStrategy,
    missingTags,
    existingTags,
    allTags: preview.tags,
    organizationId,
    apiClient,
  });

  return {
    existingTags,
    missingTags,
    tagMapping,
  };
}

async function selectTagStrategy({ hasMissingTags }: { hasMissingTags: boolean }): Promise<TagStrategy> {
  if (!hasMissingTags) {
    return 'create-and-map';
  }

  const strategy = await exitOnCancel(
    prompts.select({
      message: 'How should we handle tags?',
      options: [
        {
          value: 'create-and-map' as const,
          label: 'Create missing tags and map existing ones',
          hint: 'Recommended',
        },
        {
          value: 'create-all' as const,
          label: 'Create all tags from export',
          hint: 'Will create duplicate tags if names match',
        },
        {
          value: 'skip' as const,
          label: 'Skip tag import',
          hint: 'Documents will be imported without tags',
        },
      ],
      initialValue: 'create-and-map' as const,
    }),
  );

  return strategy;
}

async function executeTagStrategy({
  strategy,
  missingTags,
  existingTags,
  allTags,
  organizationId,
  apiClient,
}: {
  strategy: TagStrategy;
  missingTags: PaperlessTagItem[];
  existingTags: Array<{ id: string; name: string }>;
  allTags: PaperlessTagItem[];
  organizationId: string;
  apiClient: Client;
}): Promise<Map<number, string>> {
  const tagMapping = new Map<number, string>();

  if (strategy === 'skip') {
    return tagMapping;
  }

  const tagsToCreate = strategy === 'create-all' ? allTags : missingTags;

  if (tagsToCreate.length > 0) {
    const prog = prompts.progress({ max: tagsToCreate.length });
    prog.start(`Creating ${pluralize(tagsToCreate.length, 'tag')}`);

    let createdCount = 0;

    for (const [index, tag] of tagsToCreate.entries()) {
      prog.message(`Creating tag ${index + 1}/${tagsToCreate.length}: ${tag.fields.name}`);
      const [result, error] = await safely(
        apiClient.createTag({
          organizationId,
          name: tag.fields.name,
          color: tag.fields.color,
        }),
      );

      if (error) {
        prog.message(`Failed to create tag "${tag.fields.name}": ${getErrorMessage(error)}`);
        prompts.log.warn(`Failed to create tag "${tag.fields.name}": ${getErrorMessage(error)}`);
      } else if (result) {
        prog.message(`Created tag "${tag.fields.name}": ${result.tag.id}`);
        tagMapping.set(tag.pk, result.tag.id);
        createdCount++;
      }

      prog.advance(1);
    }

    prog.stop(`Created ${pluralize(createdCount, 'tag')} ✓`);
  }

  if (strategy === 'create-and-map') {
    for (const existingTag of existingTags) {
      const paperlessTag = allTags.find(tag => tag.fields.name === existingTag.name);
      if (paperlessTag && !tagMapping.has(paperlessTag.pk)) {
        tagMapping.set(paperlessTag.pk, existingTag.id);
      }
    }
  }

  return tagMapping;
}

export async function selectDocumentStrategy(): Promise<DocumentStrategy> {
  const strategy = await exitOnCancel(
    prompts.select({
      message: 'How should we import documents?',
      options: [
        {
          value: 'import-with-tags' as const,
          label: 'Import documents and apply tags',
          hint: 'Recommended',
        },
        {
          value: 'import-without-tags' as const,
          label: 'Import documents without tags',
        },
        {
          value: 'skip' as const,
          label: 'Skip document import',
        },
      ],
      initialValue: 'import-with-tags' as const,
    }),
  );

  return strategy;
}

export async function importDocuments({
  manifest,
  archivePath,
  organizationId,
  apiClient,
  tagMapping,
  applyTags,
}: {
  manifest: Awaited<ReturnType<typeof extractManifest>>;
  archivePath: string;
  organizationId: string;
  apiClient: Client;
  tagMapping: Map<number, string>;
  applyTags: boolean;
}): Promise<ImportStats> {
  const preview = parseManifest({ manifest });
  const documents = preview.documents;

  const stats: ImportStats = {
    documentsImported: 0,
    documentsSkipped: 0,
    documentsFailed: 0,
    tagsCreated: tagMapping.size,
    errors: [],
  };

  const prog = prompts.progress({ max: documents.length });
  prog.start(`Importing ${pluralize(documents.length, 'document')}`);

  const archive = await readArchive({ archivePath });

  for (const [index, document] of documents.entries()) {
    prog.message(`Importing document ${index + 1}/${documents.length}: ${document.fields.title}`);
    const [, error] = await safely(
      importSingleDocument({
        document,
        archive,
        organizationId,
        apiClient,
        tagMapping: applyTags ? tagMapping : new Map(),
      }),
    );

    if (error) {
      const isDuplicate = isDocumentAlreadyExistsError(error);

      if (isDuplicate) {
        stats.documentsSkipped++;
      } else {
        const errorMessage = getErrorMessage(error);
        stats.documentsFailed++;
        stats.errors.push({
          fileName: document.fields.original_filename,
          error: errorMessage,
        });

        prog.message(`Failed to import document "${document.fields.title}"`);
      }
    } else {
      prog.message(`Imported document "${document.fields.title}"`);
      stats.documentsImported++;
    }

    prog.advance(1);
  }

  prog.stop(`Import completed ✓`);

  return stats;
}

async function importSingleDocument({
  document,
  archive,
  organizationId,
  apiClient,
  tagMapping,
}: {
  document: PaperlessDocumentItem;
  archive: JSZip;
  organizationId: string;
  apiClient: Client;
  tagMapping: Map<number, string>;
}) {
  const file = await createFileFromDocument({ document, archive });

  const { document: uploadedDocument } = await apiClient.uploadDocument({
    organizationId,
    file,
  });

  const documentTags = document.fields.tags
    .map(tagPk => tagMapping.get(tagPk))
    .filter((tagId): tagId is string => tagId !== undefined);

  for (const tagId of documentTags) {
    const [, error] = await safely(
      apiClient.addTagToDocument({
        organizationId,
        documentId: uploadedDocument.id,
        tagId,
      }),
    );

    if (error) {
      prompts.log.warn(
        `Failed to add tag (ID: ${tagId}) to document "${document.fields.title}": ${getErrorMessage(error)}`,
      );
    }
  }

  return uploadedDocument;
}

async function createFileFromDocument({
  document,
  archive,
}: {
  document: PaperlessDocumentItem;
  archive: JSZip;
}): Promise<File> {
  const filePath = document.__exported_file_name__;
  const fileName = document.fields.original_filename ?? document.__exported_file_name__ ?? document.fields.title ?? 'untitled';

  const fileBuffer = await extractFileFromArchive({
    archive,
    filePath,
  });

  const mimeType = document.fields.mime_type ?? mime.lookup(fileName) ?? 'application/octet-stream';

  return new File([fileBuffer as BlobPart], fileName, { type: mimeType });
}

export function displayImportSummary({ stats }: { stats: ImportStats }): void {
  const summaryLines = [
    stats.tagsCreated > 0 ? `${pc.green('✓')} ${pluralize(stats.tagsCreated, 'tag')} created` : null,
    `${pc.green('✓')} ${pluralize(stats.documentsImported, 'document')} imported`,
    stats.documentsSkipped > 0 ? `${pc.yellow('⊘')} ${pluralize(stats.documentsSkipped, 'document')} skipped (already exist)` : null,
    stats.documentsFailed > 0 ? `${pc.red('✗')} ${pluralize(stats.documentsFailed, 'document')} failed` : null,
  ].filter(Boolean);

  prompts.note(summaryLines.join('\n'), 'Import summary');

  if (stats.errors.length > 0) {
    prompts.note(
      stats.errors.map(({ fileName, error }) => `  - ${fileName}: ${error}`).join('\n'),
      `Errors (${stats.errors.length})`,
    );
  }
}

function isDocumentAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as Record<string, unknown>;
  const status = err.status ?? err.statusCode;

  return status === 409;
}
