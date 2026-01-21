import type { DocumentActivityEvent } from './documents.types';
import { IN_MS } from '../shared/utils/units';
import { DEFAULT_DOCUMENT_ICON } from './documents.constants';

export const fileIcons: { mimeTypes: string[]; extensions: string[]; icon: string }[] = [
  {
    mimeTypes: ['image'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'heic'],
    icon: 'i-tabler-photo',
  },
  {
    mimeTypes: ['video'],
    extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'],
    icon: 'i-tabler-video',
  },
  {
    mimeTypes: ['audio'],
    extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac'],
    icon: 'i-tabler-file-music',
  },
  {
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
    icon: 'i-tabler-file-type-pdf',
  },
  {
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
    extensions: ['zip', 'rar', '7z'],
    icon: 'i-tabler-file-zip',
  },
  {
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    extensions: ['xls', 'xlsx'],
    icon: 'i-tabler-file-excel',
  },
  {
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: ['doc', 'docx'],
    icon: 'i-tabler-file-word',
  },
  {
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: ['ppt', 'pptx'],
    icon: 'i-tabler-file-type-ppt',
  },
  {
    mimeTypes: ['text/plain'],
    extensions: ['txt', 'md', 'rtf'],
    icon: 'i-tabler-file-text',
  },
  {
    mimeTypes: ['application/json', 'application/xml', 'application/javascript', 'application/typescript', 'text/xml', 'text/javascript', 'text/typescript'],
    extensions: ['json', 'xml', 'js', 'ts'],
    icon: 'i-tabler-file-code',
  },
  {
    mimeTypes: ['text/html'],
    extensions: ['html', 'htm'],
    icon: 'i-tabler-file-type-html',
  },
  {
    mimeTypes: ['text/css'],
    extensions: ['css'],
    icon: 'i-tabler-file-type-css',
  },
  {
    mimeTypes: ['text/csv'],
    extensions: ['csv'],
    icon: 'i-tabler-file-type-csv',
  },
];

// Indexed the icons by mime type and extension for quick lookup
export const { iconByExtension, iconByFileType } = fileIcons.reduce(
  ({ iconByFileType, iconByExtension }, { mimeTypes, extensions, icon }) => ({
    iconByFileType: {
      ...iconByFileType,
      ...Object.fromEntries(mimeTypes.map(mimeType => [mimeType, icon])),
    },
    iconByExtension: {
      ...iconByExtension,
      ...Object.fromEntries(extensions.map(extension => [extension, icon])),
    },
  }),
  { iconByFileType: {} as Record<string, string>, iconByExtension: {} as Record<string, string> },
);

export function getDocumentIcon({
  document,
  iconByMimeTypeMap = iconByFileType,
  iconByExtensionMap = iconByExtension,
  defaultIcon = DEFAULT_DOCUMENT_ICON,
}: { document: {
  mimeType?: string;
  name?: string;
}; iconByMimeTypeMap?: Record<string, string>; iconByExtensionMap?: Record<string, string>; defaultIcon?: string; }): string {
  const { mimeType, name } = document;

  const mimeTypeIcon = mimeType ? iconByMimeTypeMap[mimeType] : undefined;
  if (mimeTypeIcon) {
    return mimeTypeIcon;
  }

  const mimeTypeGroup = mimeType?.split('/')[0];
  const mimeTypeGroupIcon = mimeTypeGroup ? iconByMimeTypeMap[mimeTypeGroup] : undefined;
  if (mimeTypeGroupIcon) {
    return mimeTypeGroupIcon;
  }

  if (!name || !name.includes('.')) {
    return defaultIcon;
  }

  const extension = getDocumentNameExtension({ name });
  const extensionIcon = extension ? iconByExtensionMap[extension] : undefined;
  if (extensionIcon) {
    return extensionIcon;
  }

  return defaultIcon;
}

export function getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now = new Date() }: { document: { deletedAt?: Date }; deletedDocumentsRetentionDays: number; now?: Date }) {
  if (!document.deletedAt) {
    return undefined;
  }

  // Calculate the permanent deletion date by adding retention days to the deleted date
  const deletionDate = new Date(document.deletedAt);
  deletionDate.setDate(deletionDate.getDate() + deletedDocumentsRetentionDays);

  // Calculate the difference in milliseconds and convert to days
  const daysBeforeDeletion = Math.floor((deletionDate.getTime() - now.getTime()) / IN_MS.DAY);

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

type DocumentSearchCriteria = {
  tags?: ({ name: string; id?: string } | { id: string; name?: string })[];
  query?: string;
};

export function makeDocumentSearchQuery({ tags = [], query }: DocumentSearchCriteria = {}) {
  const quoteIfSpaces = (str: string) => (str.includes(' ') ? `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : str);

  return [
    ...tags.map(t => `tag:${quoteIfSpaces(t.name ?? t.id ?? '')}`).toSorted(),
    query,
  ].filter(Boolean).join(' ');
}

export function makeDocumentSearchPermalink({ organizationId, search }: { organizationId: string; search: DocumentSearchCriteria }) {
  const queryString = makeDocumentSearchQuery(search);

  return `/organizations/${organizationId}/documents?query=${encodeURIComponent(queryString)}`;
}
