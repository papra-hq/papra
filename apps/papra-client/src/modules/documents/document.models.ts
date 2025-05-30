import type { DocumentActivityEvent } from './documents.types';
import { addDays, differenceInDays } from 'date-fns';

export const iconByFileType = {
  '*': 'i-tabler-file',
  'image': 'i-tabler-photo',
  'video': 'i-tabler-video',
  'audio': 'i-tabler-file-music',
  'application': 'i-tabler-file-code',
  'application/pdf': 'i-tabler-file-type-pdf',
  'application/zip': 'i-tabler-file-zip',
  'application/vnd.ms-excel': 'i-tabler-file-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'i-tabler-file-excel',
  'application/msword': 'i-tabler-file-word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'i-tabler-file-word',
  'application/json': 'i-tabler-file-code',
  'application/xml': 'i-tabler-file-code',
  'application/javascript': 'i-tabler-file-type-js',
  'application/typescript': 'i-tabler-file-type-ts',
  'application/vnd.ms-powerpoint': 'i-tabler-file-type-ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'i-tabler-file-type-ppt',
  'text/plain': 'i-tabler-file-text',
  'text/html': 'i-tabler-file-type-html',
  'text/css': 'i-tabler-file-type-css',
  'text/csv': 'i-tabler-file-type-csv',
  'text/xml': 'i-tabler-file-type-xml',
  'text/javascript': 'i-tabler-file-type-js',
  'text/typescript': 'i-tabler-file-type-ts',
};

type FileTypes = keyof typeof iconByFileType;

export function getDocumentIcon({ document, iconsMap = iconByFileType }: { document: { mimeType: string }; iconsMap?: Record<string, string> & { '*': string } }): string {
  const { mimeType } = document;
  const fileTypeGroup = mimeType?.split('/')[0];

  const icon = iconsMap[mimeType as FileTypes] ?? iconsMap[fileTypeGroup as FileTypes] ?? iconsMap['*'];

  return icon;
}

export function getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now = new Date() }: { document: { deletedAt?: Date }; deletedDocumentsRetentionDays: number; now?: Date }) {
  if (!document.deletedAt) {
    return undefined;
  }

  const deletionDate = addDays(document.deletedAt, deletedDocumentsRetentionDays);

  const daysBeforeDeletion = differenceInDays(deletionDate, now);

  return daysBeforeDeletion;
}

export function getDocumentNameWithoutExtension({ name }: { name: string }) {
  const dotSplittedName = name.split('.');
  const dotCount = dotSplittedName.length - 1;

  if (dotCount === 0) {
    return name;
  }

  if (dotCount === 1 && name.startsWith('.')) {
    return name;
  }

  return dotSplittedName.slice(0, -1).join('.');
}

export function getDocumentNameExtension({ name }: { name: string }) {
  const dotSplittedName = name.split('.');
  const dotCount = dotSplittedName.length - 1;

  if (dotCount === 0) {
    return undefined;
  }

  if (dotCount === 1 && name.startsWith('.')) {
    return undefined;
  }

  return dotSplittedName[dotCount];
}

export const documentActivityIcon: Record<DocumentActivityEvent, string> = {
  created: 'i-tabler-file-plus',
  updated: 'i-tabler-file-diff',
  deleted: 'i-tabler-file-x',
  restored: 'i-tabler-file-check',
  tagged: 'i-tabler-tag',
  untagged: 'i-tabler-tag-off',
} as const;

export function getDocumentActivityIcon({ event }: { event: DocumentActivityEvent }) {
  return documentActivityIcon[event] ?? 'i-tabler-file';
}
