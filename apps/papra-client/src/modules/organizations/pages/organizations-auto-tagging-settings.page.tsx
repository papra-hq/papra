import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useQuery, useQueryClient } from '@tanstack/solid-query';
import { createEffect, createSignal, on, Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
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
import type { fetchOrganizationSettings } from '../organizations.services';
import { updateOrganizationSettings } from '../organizations.services';
import { TextArea } from '@/modules/ui/components/textarea';
import {
  TextFieldRoot,
  TextFieldLabel,
  TextFieldDescription,
  textfieldLabel,
} from '@/modules/ui/components/textfield';
import { useConfig } from '@/modules/config/config.provider';

const MIN_MAX_TAGS = 1;
const MAX_MAX_TAGS = 100;

type AutoTaggingSettings = Awaited<
  ReturnType<typeof fetchOrganizationSettings>
>['organizationSettings']['ai']['autoTagging'];

const AutoTaggingSettingsCard: Component<{
  organizationId: string;
  settings: AutoTaggingSettings;
}> = (props) => {
  const queryClient = useQueryClient();
  const { getErrorMessage } = useI18nApiErrors();
  const { t } = useI18n();

  const [getMaxTags, setMaxTags] = createSignal(props.settings.maxTags);

  const [getFilenamePrompt, setFilenamePrompt] = createSignal(props.settings.filenamePrompt);
  const [getTaggingPrompt, setTaggingPrompt] = createSignal(props.settings.taggingPrompt);
  const [getTaggingPromptDirty, setTaggingPromptDirty] = createSignal(false);
  const [getSavingPrompts, setSavingPrompts] = createSignal(false);
  const [getPromptDirty, setPromptDirty] = createSignal(false);
  createEffect(
    on(
      () => props.organizationId,
      () => {
        setPromptDirty(false);
        setTaggingPromptDirty(false);
      },
    ),
  );
  createEffect(() => {
    if (!getPromptDirty()) setFilenamePrompt(props.settings.filenamePrompt);
  });

  createEffect(() => {
    if (!getTaggingPromptDirty()) setTaggingPrompt(props.settings.taggingPrompt);
  });

  // Keep the local max tags input in sync with the latest fetched settings.
  createEffect(() => {
    setMaxTags(props.settings.maxTags);
  });

  const updateSettings = async (autoTagging: Partial<AutoTaggingSettings>) => {
    const organizationId = props.organizationId;
    const [, error] = await safely(
      updateOrganizationSettings({
        organizationId,
        organizationSettingsPartials: { ai: { autoTagging } },
      }),
    );

    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return false;
    }

    await queryClient.invalidateQueries(getOrganizationSettingsQueryOptions({ organizationId }));
    return organizationId === props.organizationId;
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
          onChange={async (isEnabled) => updateSettings({ isEnabled })}
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
          onChange={async (canCreateNewTags) => updateSettings({ canCreateNewTags })}
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
          onChange={async () => commitMaxTags()}
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
        <TextFieldRoot
          value={getTaggingPrompt()}
          onChange={(value) => {
            setTaggingPromptDirty(true);
            setTaggingPrompt(value);
          }}
          disabled={!props.settings.isEnabled || getSavingPrompts()}
        >
          <TextFieldLabel>
            {t('organization.settings.auto-tagging.tagging-prompt.label')}
          </TextFieldLabel>
          <TextFieldDescription>
            {t('organization.settings.auto-tagging.tagging-prompt.description')}
          </TextFieldDescription>
          <TextArea rows={5} maxLength={8000} />
        </TextFieldRoot>
        <hr />
        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.namingEnabled}
          disabled={getSavingPrompts()}
          onChange={async (namingEnabled) => updateSettings({ namingEnabled })}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel>{t('organization.settings.auto-tagging.naming.label')}</SwitchLabel>
            <SwitchDescription>
              {t('organization.settings.auto-tagging.naming.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
        <Switch
          class="flex items-center justify-between gap-4"
          checked={props.settings.separateNamingRequest}
          disabled={!props.settings.namingEnabled || getSavingPrompts()}
          onChange={async (separateNamingRequest) => updateSettings({ separateNamingRequest })}
        >
          <div class="flex flex-col gap-0.5">
            <SwitchLabel>
              {t('organization.settings.auto-tagging.separate-naming.label')}
            </SwitchLabel>
            <SwitchDescription>
              {t('organization.settings.auto-tagging.separate-naming.description')}
            </SwitchDescription>
          </div>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
        <TextFieldRoot
          value={getFilenamePrompt()}
          onChange={(value) => {
            setPromptDirty(true);
            setFilenamePrompt(value);
          }}
          disabled={!props.settings.namingEnabled || getSavingPrompts()}
        >
          <TextFieldLabel>
            {t('organization.settings.auto-tagging.filename-prompt.label')}
          </TextFieldLabel>
          <TextFieldDescription>
            {t('organization.settings.auto-tagging.filename-prompt.description')}
          </TextFieldDescription>
          <TextArea rows={10} maxLength={8000} />
        </TextFieldRoot>
        <Button
          disabled={getSavingPrompts() || (!getPromptDirty() && !getTaggingPromptDirty())}
          isLoading={getSavingPrompts()}
          onClick={async () => {
            setSavingPrompts(true);
            try {
              const saved = await updateSettings({
                ...(getPromptDirty() ? { filenamePrompt: getFilenamePrompt() } : {}),
                ...(getTaggingPromptDirty() ? { taggingPrompt: getTaggingPrompt() } : {}),
              });
              if (saved) {
                setPromptDirty(false);
                setTaggingPromptDirty(false);
                createToast({
                  type: 'success',
                  message: t('organization.settings.auto-tagging.prompts.saved'),
                });
              }
            } finally {
              setSavingPrompts(false);
            }
          }}
        >
          {t('organization.settings.auto-tagging.prompts.save')}
        </Button>
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
