import type { organizationSettingsTable } from './organization-settings.tables';

export type OrganizationSettings = {
  ai: {
    autoTagging: {
      isEnabled: boolean;
      canCreateNewTags: boolean;
      maxTags: number;
      modelId?: string;
    };
    extraction: {
      isEnabled: boolean;
      extractDate: boolean;
      extractCustomProperties: boolean;
      renameDocuments: boolean;
      filenamePattern: string;
      modelId?: string;
    };
  };
};

export type DbUpdatableOrganizationSettings = Pick<
  typeof organizationSettingsTable.$inferInsert,
  | 'aiAutoTaggingEnabled'
  | 'aiAutoTaggingCanCreateNewTags'
  | 'aiAutoTaggingMaxTags'
  | 'aiAutoTaggingModelId'
  | 'aiExtractionEnabled'
  | 'aiExtractionExtractDate'
  | 'aiExtractionExtractCustomProperties'
  | 'aiExtractionRenameDocuments'
  | 'aiExtractionFilenamePattern'
>;
