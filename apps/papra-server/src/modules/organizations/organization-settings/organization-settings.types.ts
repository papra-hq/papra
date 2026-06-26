import type { organizationSettingsTable } from './organization-settings.tables';

export type OrganizationSettings = {
  ai: {
    autoTagging: {
      isEnabled: boolean;
      canCreateNewTags: boolean;
      maxTags: number;
      modelId: string;
    };
  };
};

export type DbUpdatableOrganizationSettings = Pick<
  typeof organizationSettingsTable.$inferInsert,
  | 'aiAutoTaggingEnabled'
  | 'aiAutoTaggingCanCreateNewTags'
  | 'aiAutoTaggingMaxTags'
  | 'aiAutoTaggingModelId'
>;
