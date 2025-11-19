import { STORAGE_KEY_BASE_PREFIX } from '../lib/local-storage/local-storage.constants';
import { storage } from '../lib/local-storage/local-storage.services';

const CURRENT_ORGANIZATION_ID_KEY = `${STORAGE_KEY_BASE_PREFIX}:current-organization-id`;

export const organizationsLocalStorage = {
  getCurrentOrganizationId: async (): Promise<string | null> => {
    return storage.getItem(CURRENT_ORGANIZATION_ID_KEY);
  },

  setCurrentOrganizationId: async (organizationId: string): Promise<void> => {
    await storage.setItem(CURRENT_ORGANIZATION_ID_KEY, organizationId);
  },

  clearCurrentOrganizationId: async (): Promise<void> => {
    await storage.removeItem(CURRENT_ORGANIZATION_ID_KEY);
  },
};
