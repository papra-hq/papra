import Calendar from '@corvu/calendar';
import { createMemo } from 'solid-js';
import { CalendarNav } from './calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const DEFAULT_FROM_YEAR = 1800;

const monthOptions = Array.from({ length: 12 }, (_, i) => String(i));

function formatMonthLabel(monthIndex: string) {
  return new Date(2024, Number(monthIndex), 1).toLocaleDateString(undefined, { month: 'long' });
}

export interface CalendarMonthYearHeaderProps {
  fromYear?: number;
  toYear?: number;
}

export function CalendarMonthYearHeader(props: CalendarMonthYearHeaderProps = {}) {
  const context = Calendar.useContext<'single'>();

  const currentYear = new Date().getFullYear();
  const defaultToYear = currentYear + 50;

  const minYear = () =>
    Math.min(props.fromYear ?? DEFAULT_FROM_YEAR, context.month().getFullYear());
  const maxYear = () =>
    Math.max(props.toYear ?? defaultToYear, context.month().getFullYear());

  const yearOptions = createMemo(
    () => {
      const min = minYear();
      const max = maxYear();
      return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
    },
    [],
    {
      equals: (prev, next) =>
        prev.length === next.length &&
        prev[0] === next[0] &&
        prev[prev.length - 1] === next[next.length - 1],
    },
  );

  const isNextMonthDisabled = () => {
    const max = props.toYear ?? defaultToYear;
    const viewYear = context.month().getFullYear();
    const viewMonth = context.month().getMonth();
    return viewYear > max || (viewYear === max && viewMonth >= 11);
  };

  const isPrevMonthDisabled = () => {
    const min = props.fromYear ?? DEFAULT_FROM_YEAR;
    const viewYear = context.month().getFullYear();
    const viewMonth = context.month().getMonth();
    return viewYear < min || (viewYear === min && viewMonth <= 0);
  };

  return (
    <div class="flex items-center justify-between">
      <CalendarNav action="prev-month" disabled={isPrevMonthDisabled()}>
        <div class="i-tabler-chevron-left size-4" />
      </CalendarNav>

      <div class="flex items-center">
        <Select
          value={String(context.month().getMonth())}
          onChange={(value) => {
            if (value != null) {
              const selectedMonth = Number(value);
              if (selectedMonth === context.month().getMonth()) {
                return;
              }
              const currentViewYear = context.month().getFullYear();
              const targetDate = new Date(currentViewYear, selectedMonth, 1);
              targetDate.setFullYear(currentViewYear);
              context.setMonth(targetDate);
            }
          }}
          options={monthOptions}
          itemComponent={(itemProps) => (
            <SelectItem item={itemProps.item}>
              {formatMonthLabel(itemProps.item.rawValue)}
            </SelectItem>
          )}
        >
          <SelectTrigger
            class="border-none hover:bg-accent shadow-none text-sm font-medium gap-0"
            caretIcon={null}
          >
            <SelectValue<string>>{(state) => formatMonthLabel(state.selectedOption())}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          value={String(context.month().getFullYear())}
          onChange={(value) => {
            if (value != null) {
              const newYear = Number(value);
              if (newYear === context.month().getFullYear()) {
                return;
              }
              const targetDate = new Date(newYear, context.month().getMonth(), 1);
              targetDate.setFullYear(newYear);
              context.setMonth(targetDate);
            }
          }}
          options={yearOptions()}
          itemComponent={(itemProps) => (
            <SelectItem item={itemProps.item}>{itemProps.item.rawValue}</SelectItem>
          )}
        >
          <SelectTrigger
            class="border-none hover:bg-accent shadow-none text-sm font-medium gap-0"
            caretIcon={null}
          >
            <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <CalendarNav action="next-month" disabled={isNextMonthDisabled()}>
        <div class="i-tabler-chevron-right size-4" />
      </CalendarNav>
    </div>
  );
}
