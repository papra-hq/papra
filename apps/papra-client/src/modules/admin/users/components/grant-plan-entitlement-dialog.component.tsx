import type { Component } from 'solid-js';
import Calendar from '@corvu/calendar';
import { useMutation, useQueryClient } from '@tanstack/solid-query';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid } from '@/modules/ui/components/calendar';
import { CalendarMonthYearHeader } from '@/modules/ui/components/calendar-month-year-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/ui/components/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '@/modules/ui/components/switch';
import { grantPlanEntitlement } from '../users.services';

export const GrantPlanEntitlementDialog: Component<{
  userId: string;
  availableTypes: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = (props) => {
  const { t, formatDate } = useI18n();
  const { getErrorMessage } = useI18nApiErrors({ t });
  const queryClient = useQueryClient();

  const [getType, setType] = createSignal<string | null>(null);
  const [getIsExpirationEnabled, setIsExpirationEnabled] = createSignal(false);
  const [getExpirationDate, setExpirationDate] = createSignal<Date | null>(null);

  function computeExpiresAt(): Date | null {
    const date = getExpirationDate();

    if (!getIsExpirationEnabled() || !date) {
      return null;
    }

    // Expire at the end of the chosen day.
    const day = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
    return new Date(`${day}T23:59:59`);
  }

  const canSubmit = () => {
    if (!getType()) {
      return false;
    }

    if (getIsExpirationEnabled() && !getExpirationDate()) {
      return false;
    }

    return true;
  };

  const closeAndReset = () => {
    setType(null);
    setIsExpirationEnabled(false);
    setExpirationDate(null);
    props.onOpenChange(false);
  };

  const grantMutation = useMutation(() => ({
    mutationFn: () =>
      grantPlanEntitlement({
        userId: props.userId,
        type: getType()!,
        expiresAt: computeExpiresAt(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users', props.userId] });
      createToast({
        type: 'success',
        message: t('admin.user-detail.plan-entitlements.grant.success'),
      });
      closeAndReset();
    },
    onError: (error) => {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
    },
  }));

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('admin.user-detail.plan-entitlements.grant.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.user-detail.plan-entitlements.grant.description')}
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4">
          <div>
            <label class="text-sm font-medium mb-1 block">
              {t('admin.user-detail.plan-entitlements.grant.type-label')}
            </label>
            <Select
              options={props.availableTypes}
              itemComponent={(itemProps) => (
                <SelectItem item={itemProps.item}>
                  <span class="font-mono text-sm">{itemProps.item.rawValue}</span>
                </SelectItem>
              )}
              value={getType()}
              onChange={setType}
            >
              <SelectTrigger>
                <SelectValue<string>>
                  {(state) => <span class="font-mono text-sm">{state.selectedOption()}</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <Switch
            class="flex items-center justify-between gap-4"
            checked={getIsExpirationEnabled()}
            onChange={setIsExpirationEnabled}
          >
            <SwitchLabel class="text-sm font-medium">
              {t('admin.user-detail.plan-entitlements.grant.expiration.toggle')}
            </SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Show when={getIsExpirationEnabled()}>
            <Popover>
              <PopoverTrigger as={Button} variant="outline" class="self-start">
                <div class="i-tabler-calendar size-4 mr-2" />
                <Show
                  when={getExpirationDate()}
                  fallback={t('admin.user-detail.plan-entitlements.grant.expiration.pick-date')}
                >
                  {(getDate) => formatDate(getDate(), { dateStyle: 'medium' })}
                </Show>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-3">
                <Calendar
                  mode="single"
                  value={getExpirationDate()}
                  onValueChange={setExpirationDate}
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
        </div>

        <DialogFooter>
          <div class="flex gap-2 justify-end flex-col-reverse sm:flex-row">
            <Button variant="secondary" onClick={closeAndReset} disabled={grantMutation.isPending}>
              {t('admin.user-detail.plan-entitlements.grant.cancel')}
            </Button>
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={!canSubmit() || grantMutation.isPending}
              isLoading={grantMutation.isPending}
            >
              {t('admin.user-detail.plan-entitlements.grant.submit')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
