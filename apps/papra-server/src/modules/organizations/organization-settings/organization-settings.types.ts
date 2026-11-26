import type { organizationSettingsTable } from './organization-settings.tables';

export type OrganizationSettings = {
  ai: {
    autoTagging: {
      isEnabled: boolean;
      canCreateNewTags: boolean;
      maxTags: number;
      modelId?: string;
      namingEnabled?: boolean;
      separateNamingRequest?: boolean;
      filenamePrompt?: string;
      taggingPrompt?: string;
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
  | 'aiSeparateNamingRequest'
  | 'aiFilenamePrompt'
  | 'aiTaggingPrompt'
>;
