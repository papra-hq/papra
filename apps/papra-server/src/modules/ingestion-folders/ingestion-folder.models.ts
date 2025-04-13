import { isAbsolute, join, parse, sep as pathSeparator, relative } from 'node:path';
import { organizationIdRegex } from '../organizations/organizations.constants';

export function normalizeFilePathToIngestionFolder({
  filePath,
  ingestionFolderPath,
}: {
  filePath: string;
  ingestionFolderPath: string;
}) {
  const relativeFilePath = relative(ingestionFolderPath, filePath);

  return { relativeFilePath };
}

export function getOrganizationIdFromFilePath({ relativeFilePath }: { relativeFilePath: string }) {
  const [maybeOrganizationId] = relativeFilePath.split(pathSeparator);

  if (!maybeOrganizationId || !organizationIdRegex.test(maybeOrganizationId)) {
    return { organizationId: undefined };
  }

  return { organizationId: maybeOrganizationId };
}

export function addTimestampToFilename({ fileName, now = new Date() }: { fileName: string; now?: Date }): string {
  const { name, ext } = parse(fileName);
  const timestamp = now.getTime();

  return `${name}_${timestamp}${ext}`;
}

export function getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({ path, organizationIngestionFolderPath }: { path: string; organizationIngestionFolderPath: string }) {
  return isAbsolute(path) ? path : join(organizationIngestionFolderPath, path);
}

export function isFileInErrorFolder({ filePath, errorFolder, organizationIngestionFolderPath }: { filePath: string; errorFolder: string; organizationIngestionFolderPath: string }) {
  const errorFolderPath = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({ path: errorFolder, organizationIngestionFolderPath });

  return filePath.startsWith(errorFolderPath);
}

export function isFileInDoneFolder({ filePath, doneFolder, organizationIngestionFolderPath }: { filePath: string; doneFolder: string; organizationIngestionFolderPath: string }) {
  const doneFolderPath = getAbsolutePathFromFolderRelativeToOrganizationIngestionFolder({ path: doneFolder, organizationIngestionFolderPath });

  return filePath.startsWith(doneFolderPath);
}
