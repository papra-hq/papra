import type { ApiServerConfig } from './config.models';
import { safelySync } from '@corentinth/chisels';
import { buildStorageKey } from '../lib/local-storage/local-storage.models';
import { parseApiServerConfig } from './config.models';
import * as secureStore from 'expo-secure-store';

const CONFIG_API_SERVER_KEY = buildStorageKey(['config', 'api-server']);

export const configLocalStorage = {
  getApiServerConfig: async (): Promise<ApiServerConfig | null> => {
    const rawConfig = await secureStore.getItemAsync(CONFIG_API_SERVER_KEY);

    if (rawConfig == null) {
      return null;
    }

    const [apiServerConfig] = safelySync(() =>
      parseApiServerConfig({ config: JSON.parse(rawConfig) }),
    );

    return apiServerConfig ?? null;
  },
  setApiServerConfig: async ({ apiServerConfig }: { apiServerConfig: ApiServerConfig }) => {
    try {
      await secureStore.setItemAsync(CONFIG_API_SERVER_KEY, JSON.stringify(apiServerConfig));
    } catch (error) {
      throw new Error(
        'Could not save the server configuration. It may be too large for secure storage, try removing or shortening custom headers.',
        { cause: error },
      );
    }
  },
};
