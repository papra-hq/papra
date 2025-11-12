import type { Buffer } from 'node:buffer';
import type { ImportPreview, PaperlessCorrespondentItem, PaperlessDocumentItem, PaperlessDocumentTypeItem, PaperlessManifest, PaperlessTagItem } from './paperless.types';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

export async function extractManifest({ archivePath }: { archivePath: string }): Promise<PaperlessManifest> {
  const zipData = await readFile(archivePath);
  const zip = await JSZip.loadAsync(zipData);

  const manifestFile = zip.file('manifest.json');

  if (!manifestFile) {
    throw new Error('Invalid Paperless export: manifest.json not found');
  }

  const manifestContent = await manifestFile.async('text');
  const manifest = JSON.parse(manifestContent) as PaperlessManifest;

  return manifest;
}

export async function readArchive({ archivePath }: { archivePath: string }): Promise<JSZip> {
  const zipData = await readFile(archivePath);
  return await JSZip.loadAsync(zipData);
}

export async function extractFileFromArchive({
  archive,
  filePath,
}: {
  archive: JSZip;
  filePath: string;
}): Promise<Buffer> {
  const file = archive.file(filePath);

  if (!file) {
    throw new Error(`File not found in archive: ${filePath}`);
  }

  return await file.async('nodebuffer');
}

export function parseManifest({ manifest }: { manifest: PaperlessManifest }): ImportPreview {
  const documents: PaperlessDocumentItem[] = [];
  const tags: PaperlessTagItem[] = [];
  const correspondents: PaperlessCorrespondentItem[] = [];
  const documentTypes: PaperlessDocumentTypeItem[] = [];

  for (const item of manifest) {
    if (item.model === 'documents.document') {
      documents.push(item as PaperlessDocumentItem);
    } else if (item.model === 'documents.tag') {
      tags.push(item as PaperlessTagItem);
    } else if (item.model === 'documents.correspondent') {
      correspondents.push(item as PaperlessCorrespondentItem);
    } else if (item.model === 'documents.documenttype') {
      documentTypes.push(item as PaperlessDocumentTypeItem);
    }
  }

  return {
    documents,
    tags,
    correspondents,
    documentTypes,
  };
}
