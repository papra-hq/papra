import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { formatOrganizationSettingsForApiResponse } from './organization-settings.models';
import type { OrganizationSettingsRepository } from './organization-settings.repository';
import { resolveOrganizationSettings } from './organization-settings.usecases';

describe('organization-settings.models', () => {
  describe('formatOrganizationSettingsForApiResponse', () => {
    test('does not expose the resolved default auto-naming model id', async () => {
      const config = overrideConfig({
        ai: { defaultModelId: 'openai://server-default' },
        autoNaming: { modelId: 'openai://auto-naming-default' },
      });
      const organizationSettingsRepository = {
        getOrganizationSettings: async () => ({
          organizationRawSettings: {
            aiAutoNamingEnabled: true,
            aiAutoNamingModelId: null,
          },
        }),
      } as unknown as OrganizationSettingsRepository;

      const { organizationSettings } = await resolveOrganizationSettings({
        organizationId: 'org_1',
        config,
        organizationSettingsRepository,
      });

      expect(organizationSettings.ai.autoNaming.modelId).to.eql(
        'openai://auto-naming-default',
      );
      expect(formatOrganizationSettingsForApiResponse({ organizationSettings })).toMatchObject({
        ai: {
          autoNaming: {
            isEnabled: true,
            modelId: null,
          },
        },
      });
    });
  });
});
