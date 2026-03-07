import type { Document } from '../documents.types';
import Calendar from '@corvu/calendar';
import { useMutation } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid, CalendarNav } from '@/modules/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { updateDocument } from '../documents.services';

const YEAR_RANGE_OFFSET = 50;

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => String(i));
}

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: YEAR_RANGE_OFFSET * 2 + 1 }, (_, i) => String(currentYear - YEAR_RANGE_OFFSET + i));
}

function formatMonthLabel(monthIndex: string) {
  return new Date(2024, Number(monthIndex), 1).toLocaleDateString(undefined, { month: 'long' });
}

function CalendarMonthYearHeader() {
  const context = Calendar.useContext<'single'>();

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  return (
    <div class="flex items-center justify-between">
      <CalendarNav action="prev-month">
        <div class="i-tabler-chevron-left size-4" />
      </CalendarNav>

      <div class="flex items-center">
        <Select
          value={String(context.month().getMonth())}
          onChange={value => value != null && context.setMonth(new Date(context.month().getFullYear(), Number(value), 1))}
          options={monthOptions}
          itemComponent={itemProps => (
            <SelectItem item={itemProps.item}>
              {formatMonthLabel(itemProps.item.rawValue)}
            </SelectItem>
          )}
        >
          <SelectTrigger class="border-none hover:bg-accent shadow-none text-sm font-medium gap-0" caretIcon={null}>
            <SelectValue<string>>{state => formatMonthLabel(state.selectedOption())}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          value={String(context.month().getFullYear())}
          onChange={value => value != null && context.setMonth(new Date(Number(value), context.month().getMonth(), 1))}
          options={yearOptions}
          itemComponent={itemProps => (
            <SelectItem item={itemProps.item}>
              {itemProps.item.rawValue}
            </SelectItem>
          )}
        >
          <SelectTrigger class="border-none hover:bg-accent shadow-none text-sm font-medium gap-0" caretIcon={null}>
            <SelectValue<string>>{state => state.selectedOption()}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <CalendarNav action="next-month">
        <div class="i-tabler-chevron-right size-4" />
      </CalendarNav>
    </div>
  );
}

export function DocumentDatePicker(props: { document: Document; organizationId: string }) {
  const { t, formatDate } = useI18n();
  const { getErrorMessage } = useI18nApiErrors();

  const updateDateMutation = useMutation(() => ({
    mutationFn: (date: Date | null) => updateDocument({
      documentId: props.document.id,
      organizationId: props.organizationId,
      documentDate: date,
    }),
    onSuccess: async () => {
      await invalidateOrganizationDocumentsQuery({ organizationId: props.organizationId });
    },
    onError: (error) => {
      createToast({
        message: getErrorMessage({ error }),
        type: 'error',
      });
    },
  }));

  const handleDateChange = (date: Date | null) => {
    if (updateDateMutation.isPending) {
      return;
    }

    updateDateMutation.mutate(date);
  };

  return (
    <Popover>
      <PopoverTrigger
        as={Button}
        variant="ghost"
        class="flex items-center gap-2 group bg-transparent! p-0 h-auto text-left"
        disabled={updateDateMutation.isPending}
      >
        <Show
          when={props.document.documentDate}
          fallback={<span class="text-muted-foreground">{t('documents.info.no-date')}</span>}
        >
          {date => formatDate(date(), { dateStyle: 'medium' })}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-auto p-3">
        <Calendar
          mode="single"
          value={props.document.documentDate ?? null}
          onValueChange={handleDateChange}
          fixedWeeks
        >
          {() => (
            <div class="flex">
              <div class="flex flex-col gap-2">
                <CalendarMonthYearHeader />
                <CalendarGrid />
              </div>

              <div class="flex flex-col gap-1 min-w-32 ml-2 border-l pl-2">
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start text-sm"
                  onClick={() => handleDateChange(new Date())}
                  disabled={updateDateMutation.isPending}
                >
                  <div class="i-tabler-calendar-event size-4 mr-2 text-muted-foreground" />
                  {t('documents.info.today')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start text-sm"
                  onClick={() => handleDateChange(null)}
                  disabled={updateDateMutation.isPending}
                >
                  <div class="i-tabler-calendar-off size-4 mr-2 text-muted-foreground" />
                  {t('documents.info.no-date')}
                </Button>
              </div>
            </div>
          )}
        </Calendar>
      </PopoverContent>
    </Popover>
  );
}
