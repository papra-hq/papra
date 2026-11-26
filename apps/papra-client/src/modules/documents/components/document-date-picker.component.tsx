import type { Document } from '../documents.types';
import Calendar from '@corvu/calendar';
import { useMutation } from '@tanstack/solid-query';
import { createEffect, createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { formatDateToInputString, parseDateInput } from '@/modules/shared/date/date-input';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid } from '@/modules/ui/components/calendar';
import { CalendarMonthYearHeader } from '@/modules/ui/components/calendar-month-year-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { createToast } from '@/modules/ui/components/sonner';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { updateDocument } from '../documents.services';

function DocumentDatePickerCalendarContent(props: {
  documentDate?: Date | null;
  onDateChange: (date: Date | null) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const context = Calendar.useContext<'single'>();

  const [inputValue, setInputValue] = createSignal(formatDateToInputString(props.documentDate));

  createEffect(() => {
    setInputValue(formatDateToInputString(context.value()));
  });

  const handleApplyInput = () => {
    if (props.isPending) {
      return;
    }

    const raw = inputValue().trim();
    if (!raw) {
      props.onDateChange(null);
      return;
    }

    const parsed = parseDateInput(raw);
    if (!parsed) {
      createToast({
        message: t('documents.info.invalid-date'),
        type: 'error',
      });
      return;
    }

    const targetMonth = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    targetMonth.setFullYear(parsed.getFullYear());
    context.setMonth(targetMonth);
    props.onDateChange(parsed);
  };

  return (
    <div class="flex flex-col gap-3">
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
            onClick={() => {
              const today = new Date();
              context.setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
              props.onDateChange(today);
            }}
            disabled={props.isPending}
          >
            <div class="i-tabler-calendar-event size-4 mr-2 text-muted-foreground" />
            {t('documents.info.today')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="justify-start text-sm"
            onClick={() => props.onDateChange(null)}
            disabled={props.isPending}
          >
            <div class="i-tabler-calendar-off size-4 mr-2 text-muted-foreground" />
            {t('documents.info.no-date')}
          </Button>
        </div>
      </div>

      <div class="pt-2 border-t flex flex-col gap-1.5">
        <label for="document-date-input" class="text-xs font-medium text-muted-foreground">
          {t('documents.info.document-date')}
        </label>
        <div class="flex items-center gap-1.5">
          <input
            id="document-date-input"
            type="text"
            placeholder="YYYY-MM-DD"
            value={inputValue()}
            onInput={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyInput();
              }
            }}
            class="flex h-8 w-full rounded-md border border-input bg-inherit px-2.5 py-1 text-xs placeholder:text-muted-foreground focus-visible:(outline-none ring-1.5 ring-ring) disabled:(cursor-not-allowed opacity-50) transition-shadow"
            disabled={props.isPending}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="h-8 px-2.5 text-xs whitespace-nowrap"
            onClick={handleApplyInput}
            disabled={props.isPending}
          >
            {t('documents.info.apply-date')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentDatePicker(props: { document: Document; organizationId: string }) {
  const { t, formatDate } = useI18n();
  const { getErrorMessage } = useI18nApiErrors();

  const updateDateMutation = useMutation(() => ({
    mutationFn: async (date: Date | null) =>
      updateDocument({
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
          {(date) => formatDate(date(), { dateStyle: 'medium' })}
        </Show>
        <div class="i-tabler-pencil size-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </PopoverTrigger>
      <PopoverContent class="w-auto p-3">
        <Calendar
          mode="single"
          value={props.document.documentDate ?? null}
          onValueChange={handleDateChange}
          disabled={() => updateDateMutation.isPending}
          fixedWeeks
        >
          {() => (
            <DocumentDatePickerCalendarContent
              documentDate={props.document.documentDate}
              onDateChange={handleDateChange}
              isPending={updateDateMutation.isPending}
            />
          )}
        </Calendar>
      </PopoverContent>
    </Popover>
  );
}
