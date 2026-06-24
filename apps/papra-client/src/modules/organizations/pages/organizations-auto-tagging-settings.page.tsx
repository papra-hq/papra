import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useQuery, useQueryClient } from '@tanstack/solid-query';
import { createEffect, createSignal, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Card, CardContent } from '@/modules/ui/components/card';
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldDescription,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from '@/modules/ui/components/number-field';
import { createToast } from '@/modules/ui/components/sonner';
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchLabel,
  SwitchThumb,
} from '@/modules/ui/components/switch';
import { getOrganizationSettingsQueryOptions } from '../organizations.queries';
import { updateOrganizationSettings } from '../organizations.services';
import { textfieldLabel } from '@/modules/ui/components/textfield';
import { useConfig } from '@/modules/config/config.provider';

const MIN_MAX_TAGS = 1;
const MAX_MAX_TAGS = 100;

type AutoTaggingSettings = {
  isEnabled: boolean;
  canCreateNewTags: boolean;
  maxTags: number;
};

const AutoTaggingSettingsCard: Component<{
  organizationId: string;
  settings: AutoTaggingSettings;
}> = (props) => {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useI18nApiErrors();
  const { t } = useI18n();

  const [getMaxTags, setMaxTags] = createSignal(props.settings.maxTags);

  // Keep the local max tags input in sync with the latest fetched settings.
  createEffect(() => {
    setMaxTags(props.settings.maxTags);
  });

  const updateSettings = async (autoTagging: Partial<AutoTaggingSettings>) => {
    const [, error] = await safely(
      updateOrganizationSettings({
        organizationId: props.organizationId,
        organizationSettingsPartials: { ai: { autoTagging } },
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

  const commitMaxTags = async () => {
    const clamped = Math.min(Math.max(Math.round(getMaxTags()), MIN_MAX_TAGS), MAX_MAX_TAGS);

    if (clamped === props.settings.maxTags) {
      setMaxTags(clamped);
      return;
    }

    setMaxTags(clamped);
    await updateSettings({ maxTags: clamped });
  };

  return (
    <Card>
      <CardContent class="pt-6 flex flex-col gap-6">
        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.isEnabled}
          onChange={(isEnabled) => updateSettings({ isEnabled })}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.auto-tagging.enabled.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.auto-tagging.enabled.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <hr />

        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.canCreateNewTags}
          onChange={(canCreateNewTags) => updateSettings({ canCreateNewTags })}
          disabled={!props.settings.isEnabled}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel class={textfieldLabel({ label: true })}>
              {t('organization.settings.auto-tagging.create-tags.label')}
            </SwitchLabel>
            <SwitchDescription class={textfieldLabel({ label: false, description: true })}>
              {t('organization.settings.auto-tagging.create-tags.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>

        <NumberField
          class="flex items-center justify-between gap-4"
          rawValue={getMaxTags()}
          onRawValueChange={setMaxTags}
          onChange={() => commitMaxTags()}
          minValue={MIN_MAX_TAGS}
          maxValue={MAX_MAX_TAGS}
          step={1}
          disabled={!props.settings.isEnabled}
        >
          <div class="flex flex-col gap-0.5">
            <NumberFieldLabel>
              {t('organization.settings.auto-tagging.max-tags.label')}
            </NumberFieldLabel>
            <NumberFieldDescription>
              {t('organization.settings.auto-tagging.max-tags.description', {
                min: MIN_MAX_TAGS,
                max: MAX_MAX_TAGS,
              })}
            </NumberFieldDescription>
          </div>

          <NumberFieldGroup class="max-w-150px w-full">
            <NumberFieldInput />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </NumberFieldGroup>
        </NumberField>
      </CardContent>
    </Card>
  );
};

export const OrganizationsAutoTaggingSettingsPage: Component = () => {
  const params = useParams();
  const { t } = useI18n();
  const { config } = useConfig();

  const organizationSettingsQuery = useQuery(() =>
    getOrganizationSettingsQueryOptions({ organizationId: params.organizationId }),
  );

  const getIsAutoTaggingAvailableForOrganization = () => config.autoTagging.isEnabled;

  return (
    <div class="p-6 pb-32 mx-auto max-w-screen-md w-full">
      <Suspense>
        <Show when={organizationSettingsQuery.data?.organizationSettings}>
          {(getOrganizationSettings) => (
            <>
              <h1 class="text-xl font-semibold mb-2">
                {t('organization.settings.auto-tagging.page.title')}
              </h1>

              <p class="text-muted-foreground">
                {t('organization.settings.auto-tagging.page.description')}
              </p>

              <div class="mt-6 flex flex-col gap-6">
                <Show
                  when={getIsAutoTaggingAvailableForOrganization()}
                  fallback={
                    <Card>
                      <CardContent class="pt-6 flex items-center gap-3 text-muted-foreground">
                        <div class="i-tabler-tag-off size-5 flex-shrink-0" />
                        <p class="text-sm">{t('organization.settings.auto-tagging.unavailable')}</p>
                      </CardContent>
                    </Card>
                  }
                >
                  <AutoTaggingSettingsCard
                    organizationId={params.organizationId}
                    settings={getOrganizationSettings().ai.autoTagging}
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
