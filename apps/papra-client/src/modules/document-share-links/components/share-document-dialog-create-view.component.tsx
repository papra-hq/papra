import type { Component } from 'solid-js';
import Calendar from '@corvu/calendar';
import { useMutation } from '@tanstack/solid-query';
import { createSignal, For, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid } from '@/modules/ui/components/calendar';
import { CalendarMonthYearHeader } from '@/modules/ui/components/calendar-month-year-header';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/ui/components/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { createToast } from '@/modules/ui/components/sonner';
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchLabel,
  SwitchThumb,
} from '@/modules/ui/components/switch';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { invalidateShareLinksQueries, useCopyShareLink } from '../document-share-links.composables';
import { generateShareLinkPassword } from '../document-share-links.models';
import { createShareLink } from '../document-share-links.services';

type ExpirationPreset = '24h' | '7d' | '30d' | 'custom';

export const ShareDocumentDialogCreateView: Component<{
  document: { id: string; organizationId: string; name: string };
  onCancel: () => void;
  onCreated: (args: { url: string }) => void;
}> = (props) => {
  const { t, formatDate } = useI18n();
  const { copyShareLink } = useCopyShareLink();
  const { getErrorMessage } = useI18nApiErrors();

  const [getIsPasswordEnabled, setIsPasswordEnabled] = createSignal(false);
  const [getPassword, setPassword] = createSignal('');
  const [getIsExpirationEnabled, setIsExpirationEnabled] = createSignal(false);
  const [getExpirationPreset, setExpirationPreset] = createSignal<ExpirationPreset>('7d');
  const [getCustomDate, setCustomDate] = createSignal<Date | null>(null);

  function computeExpiresAt(): Date | null {
    if (!getIsExpirationEnabled()) {
      return null;
    }

    const preset = getExpirationPreset();

    if (preset === 'custom') {
      const date = getCustomDate();

      if (!date) {
        return null;
      }

      // Expire at the end of the chosen day.
      const day = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
      return new Date(`${day}T23:59:59`);
    }

    const days = preset === '24h' ? 1 : preset === '7d' ? 7 : 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  const canSubmit = () => {
    if (getIsPasswordEnabled() && getPassword().trim() === '') {
      return false;
    }

    if (getIsExpirationEnabled() && getExpirationPreset() === 'custom' && !getCustomDate()) {
      return false;
    }

    return true;
  };

  const createMutation = useMutation(() => ({
    mutationFn: () =>
      createShareLink({
        organizationId: props.document.organizationId,
        documentId: props.document.id,
        expiresAt: computeExpiresAt(),
        password: getIsPasswordEnabled() && getPassword() !== '' ? getPassword() : undefined,
      }),
    onSuccess: async ({ shareLink }) => {
      await invalidateShareLinksQueries({ organizationId: props.document.organizationId });
      await copyShareLink({ url: shareLink.url });
      props.onCreated({ url: shareLink.url });
    },
    onError: (error) => {
      createToast({
        type: 'error',
        message: getErrorMessage({ error, defaultMessage: t('document-share-links.create.error') }),
      });
    },
  }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('document-share-links.create.title')}</DialogTitle>
        <DialogDescription>{t('document-share-links.create.description')}</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col">
        <div class="flex flex-col gap-3 py-4 border-t">
          <Switch
            class="flex items-center justify-between gap-4"
            checked={getIsPasswordEnabled()}
            onChange={setIsPasswordEnabled}
          >
            <div class="flex flex-col gap-0.5">
              <SwitchLabel class="text-sm font-medium">
                {t('document-share-links.create.password.toggle')}
              </SwitchLabel>
              <SwitchDescription class="text-xs text-muted-foreground">
                {t('document-share-links.create.password.hint')}
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Show when={getIsPasswordEnabled()}>
            <div class="flex items-center gap-2">
              <TextFieldRoot class="flex-1">
                <TextField
                  type="text"
                  autocomplete="off"
                  placeholder={t('document-share-links.create.password.placeholder')}
                  value={getPassword()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                />
              </TextFieldRoot>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(generateShareLinkPassword())}
              >
                <div class="i-tabler-refresh size-4 mr-2" />
                {t('document-share-links.create.password.generate')}
              </Button>
            </div>
          </Show>
        </div>

        <div class="flex flex-col gap-3 py-4 border-t">
          <Switch
            class="flex items-center justify-between gap-4"
            checked={getIsExpirationEnabled()}
            onChange={setIsExpirationEnabled}
          >
            <div class="flex flex-col gap-0.5">
              <SwitchLabel class="text-sm font-medium">
                {t('document-share-links.create.expiration.toggle')}
              </SwitchLabel>
              <SwitchDescription class="text-xs text-muted-foreground">
                {t('document-share-links.create.expiration.hint')}
              </SwitchDescription>
            </div>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Show when={getIsExpirationEnabled()}>
            <div class="flex flex-wrap items-center gap-2">
              <For each={['24h', '7d', '30d', 'custom'] as const}>
                {(preset) => (
                  <Button
                    type="button"
                    size="sm"
                    variant={getExpirationPreset() === preset ? 'default' : 'outline'}
                    onClick={() => setExpirationPreset(preset)}
                  >
                    {t(`document-share-links.create.expiration.${preset}`)}
                  </Button>
                )}
              </For>
            </div>

            <Show when={getExpirationPreset() === 'custom'}>
              <Popover>
                <PopoverTrigger as={Button} variant="outline" class="self-start">
                  <div class="i-tabler-calendar size-4 mr-2" />
                  <Show
                    when={getCustomDate()}
                    fallback={t('document-share-links.create.expiration.pick-date')}
                  >
                    {(getDate) => formatDate(getDate(), { dateStyle: 'medium' })}
                  </Show>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-3">
                  <Calendar
                    mode="single"
                    value={getCustomDate()}
                    onValueChange={setCustomDate}
                    fixedWeeks
                  >
                    {() => (
                      <div class="flex flex-col gap-2">
                        <CalendarMonthYearHeader />
                        <CalendarGrid />
                      </div>
                    )}
                  </Calendar>
                </PopoverContent>
              </Popover>
            </Show>
          </Show>
        </div>
      </div>

      <DialogFooter>
        <div class="flex gap-2 justify-end flex-col-reverse sm:flex-row">
          <Button variant="secondary" onClick={props.onCancel} disabled={createMutation.isPending}>
            {t('document-share-links.create.cancel')}
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit() || createMutation.isPending}
            isLoading={createMutation.isPending}
          >
            {t('document-share-links.create.submit')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};
