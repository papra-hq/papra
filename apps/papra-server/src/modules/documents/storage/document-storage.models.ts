export function addSuffixToFileName({ storageKey, suffix }: { storageKey: string; suffix: string | number }) {
  const lastSlashIndex = storageKey.lastIndexOf('/');
  const dir = lastSlashIndex === -1 ? '' : storageKey.slice(0, lastSlashIndex + 1);
  const fileName = lastSlashIndex === -1 ? storageKey : storageKey.slice(lastSlashIndex + 1);

  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${dir}${fileName}_${suffix}`;
  }

  if (dotIndex === 0) {
    return `${dir}${fileName}_${suffix}`;
  }

  return `${dir}${fileName.slice(0, dotIndex)}_${suffix}${fileName.slice(dotIndex)}`;
}
