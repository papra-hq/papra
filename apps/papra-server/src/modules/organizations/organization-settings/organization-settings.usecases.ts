import type { Config } from '../../config/config.types';
import type { OrganizationSettingsRepository } from './organization-settings.repository';
import type { OrganizationSettings } from './organization-settings.types';

export type ResolveOrganizationSettingsUsecase = ReturnType<
  typeof createResolveOrganizationSettingsUsecase
>;

export function createResolveOrganizationSettingsUsecase({
  config,
  organizationSettingsRepository,
}: {
  config: Config;
  organizationSettingsRepository: OrganizationSettingsRepository;
}) {
  return async ({
    organizationId,
  }: {
    organizationId: string;
  }): Promise<{
    organizationSettings: OrganizationSettings;
  }> =>
    resolveOrganizationSettings({
      organizationId,
      config,
      organizationSettingsRepository,
    });
}

export async function resolveOrganizationSettings({
  organizationId,
  config,
  organizationSettingsRepository,
}: {
  organizationId: string;

  config: Config;
  organizationSettingsRepository: OrganizationSettingsRepository;
}): Promise<{
  organizationSettings: OrganizationSettings;
}> {
  const { organizationRawSettings } = await organizationSettingsRepository.getOrganizationSettings({
    organizationId,
  });

  return {
    organizationSettings: {
      ai: {
        autoTagging: {
          isEnabled: organizationRawSettings?.aiAutoTaggingEnabled ?? false,

          canCreateNewTags: organizationRawSettings?.aiAutoTaggingCanCreateNewTags ?? false,

          maxTags:
            organizationRawSettings?.aiAutoTaggingMaxTags ?? config.autoTagging.defaultMaxTags,

          modelId:
            organizationRawSettings?.aiAutoTaggingModelId ??
            config.autoTagging.modelId ??
            config.ai.defaultModelId,
        },
      },
    },
  };
}
