import { pick } from '../../shared/objects';
import type { OrganizationSettings } from './organization-settings.types';

export function formatOrganizationSettingsForApiResponse({
  organizationSettings,
}: {
  organizationSettings: OrganizationSettings;
}) {
  return {
    ai: {
      autoTagging: pick(organizationSettings.ai.autoTagging, [
        'isEnabled',
        'canCreateNewTags',
        'maxTags',
      ]),
    },
  };
}
