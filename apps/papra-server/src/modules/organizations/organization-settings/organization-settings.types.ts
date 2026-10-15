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
    };
    autoDocumentDate: {
      isEnabled: boolean;
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
  | 'aiAutoDocumentDateEnabled'
>;
