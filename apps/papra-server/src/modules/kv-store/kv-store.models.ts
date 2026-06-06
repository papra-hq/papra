import { KV_STORE_KEY_PART_SEPARATOR } from './kv-store.constants';

export function joinKeyParts(parts: string[]): string {
  return parts.join(KV_STORE_KEY_PART_SEPARATOR);
}
