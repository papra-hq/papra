import type { organizationSettingsTable } from './organization-settings.tables';

export type OrganizationSettings = {
  ai: {
    autoTagging: {
      isEnabled: boolean;
      canCreateNewTags: boolean;
      maxTags: number;
      modelId?: string;
    };
    autoNaming: {
      isEnabled: boolean;
      modelId?: string;
      modelIdForApiResponse?: string | null;
    };
  };
};

export type DbUpdatableOrganizationSettings = Pick<
  typeof organizationSettingsTable.$inferInsert,
  | 'aiAutoTaggingEnabled'
  | 'aiAutoTaggingCanCreateNewTags'
  | 'aiAutoTaggingMaxTags'
  | 'aiAutoTaggingModelId'
  | 'aiAutoNamingEnabled'
  | 'aiAutoNamingModelId'
>;
