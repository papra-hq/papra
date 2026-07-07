export function splitFileName(fileName: string): {
  baseName: string;
  extension: string | undefined;
} {
  const extension = getExtension(fileName);

  if (extension === undefined) {
    return { baseName: fileName, extension: undefined };
  }

  return {
    baseName: fileName.slice(0, fileName.length - extension.length - 1),
    extension,
  };
}

export function joinFileName({
  baseName,
  extension,
}: {
  baseName: string;
  extension: string | undefined;
}): string {
  if (extension === undefined) {
    return baseName;
  }

  return `${baseName}.${extension}`;
}

export function getExtension(path: string): string | undefined {
  const parts = path.split('.');
  if (parts.length <= 1) {
    return undefined;
  }

  const extension = parts.at(-1)?.toLowerCase();

  if (extension === '') {
    return undefined;
  }

  return extension;
}
