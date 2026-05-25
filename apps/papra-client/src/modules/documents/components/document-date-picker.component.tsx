import type { Document } from '../documents.types';
import Calendar from '@corvu/calendar';
import { useMutation } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { CalendarGrid } from '@/modules/ui/components/calendar';
import { CalendarMonthYearHeader } from '@/modules/ui/components/calendar-month-year-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { createToast } from '@/modules/ui/components/sonner';
import { invalidateOrganizationDocumentsQuery } from '../documents.composables';
import { updateDocument } from '../documents.services';

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
