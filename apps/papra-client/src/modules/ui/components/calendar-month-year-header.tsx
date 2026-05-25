import Calendar from '@corvu/calendar';
import { CalendarNav } from './calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const YEAR_RANGE_OFFSET = 50;

const monthOptions = Array.from({ length: 12 }, (_, i) => String(i));
const yearOptions = (() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: YEAR_RANGE_OFFSET * 2 + 1 }, (_, i) => String(currentYear - YEAR_RANGE_OFFSET + i));
})();

function formatMonthLabel(monthIndex: string) {
  return new Date(2024, Number(monthIndex), 1).toLocaleDateString(undefined, { month: 'long' });
}

export function CalendarMonthYearHeader() {
  const context = Calendar.useContext<'single'>();

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
