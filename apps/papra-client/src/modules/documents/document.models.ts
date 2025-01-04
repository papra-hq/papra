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
