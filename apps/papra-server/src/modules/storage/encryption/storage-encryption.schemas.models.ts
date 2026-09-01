export function areStorageKeyEncryptionKeysUnique(keys: { version: string }[]) {
  return keys.length === new Set(keys.map((k) => k.version)).size;
}
