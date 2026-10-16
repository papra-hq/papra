import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useQuery, useQueryClient } from '@tanstack/solid-query';
import { createEffect, createSignal, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Card, CardContent } from '@/modules/ui/components/card';
import { createToast } from '@/modules/ui/components/sonner';
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchLabel,
  SwitchThumb,
} from '@/modules/ui/components/switch';
import {
  TextField,
  TextFieldDescription,
  TextFieldLabel,
  TextFieldRoot,
  textfieldLabel,
} from '@/modules/ui/components/textfield';
import { getOrganizationSettingsQueryOptions } from '../organizations.queries';
import { updateOrganizationSettings } from '../organizations.services';
import { useConfig } from '@/modules/config/config.provider';

type ExtractionSettings = {
  isEnabled: boolean;
  extractDate: boolean;
  extractCustomProperties: boolean;
  renameDocuments: boolean;
  filenamePattern: string;
};

const ExtractionSettingsCard: Component<{
  organizationId: string;
  settings: ExtractionSettings;
}> = (props) => {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useI18nApiErrors();
  const { t } = useI18n();

  const [getFilenamePattern, setFilenamePattern] = createSignal(props.settings.filenamePattern);

  createEffect(() => {
    setFilenamePattern(props.settings.filenamePattern);
  });

  const updateSettings = async (extraction: Partial<ExtractionSettings>) => {
    const [, error] = await safely(
      updateOrganizationSettings({
        organizationId: props.organizationId,
        organizationSettingsPartials: { ai: { extraction } },
      }),
    );

    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }

    await queryClient.invalidateQueries(
      getOrganizationSettingsQueryOptions({ organizationId: props.organizationId }),
    );
  };

  const commitFilenamePattern = async () => {
    const filenamePattern = getFilenamePattern().trim();

    if (filenamePattern === props.settings.filenamePattern) {
      setFilenamePattern(filenamePattern);
      return;
    }

    setFilenamePattern(filenamePattern);
    await updateSettings({ filenamePattern });
  };

  return (
    <Card>
      <CardContent class="pt-6 flex flex-col gap-6">
        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.isEnabled}
          onChange={async (isEnabled) => updateSettings({ isEnabled })}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.ai-extraction.enabled.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.ai-extraction.enabled.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <hr />

        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.extractDate}
          onChange={async (extractDate) => updateSettings({ extractDate })}
          disabled={!props.settings.isEnabled}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.ai-extraction.extract-date.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.ai-extraction.extract-date.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.extractCustomProperties}
          onChange={async (extractCustomProperties) => updateSettings({ extractCustomProperties })}
          disabled={!props.settings.isEnabled}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.ai-extraction.extract-custom-properties.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.ai-extraction.extract-custom-properties.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.renameDocuments}
          onChange={async (renameDocuments) => updateSettings({ renameDocuments })}
          disabled={!props.settings.isEnabled}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.ai-extraction.rename-documents.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.ai-extraction.rename-documents.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <TextFieldRoot
          value={getFilenamePattern()}
          onChange={setFilenamePattern}
          disabled={!props.settings.isEnabled || !props.settings.renameDocuments}
        >
          <TextFieldLabel>
            {t('organization.settings.ai-extraction.filename-pattern.label')}
          </TextFieldLabel>
          <TextField
            placeholder={t('organization.settings.ai-extraction.filename-pattern.placeholder')}
            onBlur={async () => commitFilenamePattern()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
          <TextFieldDescription>
            {t('organization.settings.ai-extraction.filename-pattern.description')}
          </TextFieldDescription>
        </TextFieldRoot>
      </CardContent>
    </Card>
  );
};

export const OrganizationsAiExtractionSettingsPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const { config } = useConfig();

  const organizationSettingsQuery = useQuery(() =>
    getOrganizationSettingsQueryOptions({ organizationId: params.organizationId }),
  );

  const getIsAiExtractionAvailableForOrganization = () => config.aiExtraction.isEnabled;

  return (
    <div class="p-6 pb-32 mx-auto max-w-screen-md w-full">
      <Suspense>
        <Show when={organizationSettingsQuery.data?.organizationSettings}>
          {(getOrganizationSettings) => (
            <>
              <h1 class="text-xl font-semibold mb-2">
                {t('organization.settings.ai-extraction.page.title')}
              </h1>

              <p class="text-muted-foreground">
                {t('organization.settings.ai-extraction.page.description')}
              </p>

              <div class="mt-6 flex flex-col gap-6">
                <Show
                  when={getIsAiExtractionAvailableForOrganization()}
                  fallback={
                    <Card>
                      <CardContent class="pt-6 flex items-center gap-3 text-muted-foreground">
                        <div class="i-tabler-sparkles size-5 flex-shrink-0" />
                        <p class="text-sm">
                          {t('organization.settings.ai-extraction.unavailable')}
                        </p>
                      </CardContent>
                    </Card>
                  }
                >
                  <ExtractionSettingsCard
                    organizationId={params.organizationId}
                    settings={getOrganizationSettings().ai.extraction}
                  />
                </Show>
              </div>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
