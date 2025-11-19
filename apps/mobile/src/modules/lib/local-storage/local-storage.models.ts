import { STORAGE_KEY_BASE_PREFIX } from './local-storage.constants';

export function buildStorageKey(sections: string[]): string {
  return [STORAGE_KEY_BASE_PREFIX, ...sections].join(':');
}
