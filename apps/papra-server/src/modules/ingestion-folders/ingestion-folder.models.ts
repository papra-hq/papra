import { isAbsolute, join, parse, sep as pathSeparator, relative } from 'node:path';
import { ORGANIZATION_ID_REGEX } from '../organizations/organizations.constants';
import { isNil } from '../shared/utils';

export function normalizeFilePathToIngestionFolder({
  filePath,
  ingestionFolderPath,
}: {
  filePath: string;
  ingestionFolderPath: string;
}) {
  const relativeFilePath = relative(ingestionFolderPath, filePath).replace(/\\/g, '/');

  return { relativeFilePath };
}

export function getOrganizationIdFromFilePath({ relativeFilePath }: { relativeFilePath: string }) {
  const normalized = relativeFilePath.replace(/\\/g, '/');
  const [maybeOrganizationId] = normalized.split('/');

  if (isNil(maybeOrganizationId) || !ORGANIZATION_ID_REGEX.test(maybeOrganizationId)) {
    return { organizationId: undefined };
  }

  return { organizationId: maybeOrganizationId };
}

export function addTimestampToFilename({
  fileName,
  now = new Date(),
}: {
  fileName: string;
  now?: Date;
}): string {
  const { name, ext } = parse(fileName);
  const timestamp = now.getTime();

  return `${name}_${timestamp}${ext}`;
}

export function getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({
  path,
  organizationIngestionFolderPath,
}: {
  path: string;
  organizationIngestionFolderPath: string;
}) {
  const result = isAbsolute(path) ? path : join(organizationIngestionFolderPath, path);
  return result.replace(/\\/g, '/');
}

export function isFileInErrorFolder({
  filePath,
  errorFolder,
  organizationIngestionFolderPath,
}: {
  filePath: string;
  errorFolder: string;
  organizationIngestionFolderPath: string;
}) {
  const errorFolderPath = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({
    path: errorFolder,
    organizationIngestionFolderPath,
  });

  return filePath.replace(/\\/g, '/').startsWith(errorFolderPath);
}

export function isFileInDoneFolder({
  filePath,
  doneFolder,
  organizationIngestionFolderPath,
}: {
  filePath: string;
  doneFolder: string;
  organizationIngestionFolderPath: string;
}) {
  const doneFolderPath = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({
    path: doneFolder,
    organizationIngestionFolderPath,
  });

  return filePath.replace(/\\/g, '/').startsWith(doneFolderPath);
}
