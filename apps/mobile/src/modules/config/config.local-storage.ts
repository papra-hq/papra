import { buildStorageKey } from '../lib/local-storage/local-storage.models';
import { storage } from '../lib/local-storage/local-storage.services';

const CONFIG_API_SERVER_URL_KEY = buildStorageKey(['config', 'api-server-url']);

export const configLocalStorage = {
  getApiServerBaseUrl: async () => storage.getItem(CONFIG_API_SERVER_URL_KEY),
  setApiServerBaseUrl: async ({ apiServerBaseUrl}: { apiServerBaseUrl: string }) => storage.setItem(CONFIG_API_SERVER_URL_KEY, apiServerBaseUrl),
};
