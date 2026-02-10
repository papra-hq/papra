import { LOCAL_STORAGE_KEY_PREFIX } from './persistence.constants';

export function joinLocalStorageKey(...parts: string[]) {
  return parts.join(':');
}

export function buildLocalStorageKey(...parts: string[]) {
  return joinLocalStorageKey(LOCAL_STORAGE_KEY_PREFIX, ...parts);
}
