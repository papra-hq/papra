import type { Component, ComponentProps } from 'solid-js';
import Calendar from '@corvu/calendar';
import { For } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export { Calendar };

export const CalendarNav: Component<ComponentProps<typeof Calendar.Nav>> = (props) => {
  return (
    <Calendar.Nav
      {...props}
      class={cn(
        'inline-flex items-center justify-center rounded-md size-7 hover:bg-accent hover:text-accent-foreground transition-colors',
        props.class,
      )}
    />
  );
};

export const CalendarHeadCell: Component<ComponentProps<typeof Calendar.HeadCell>> = (props) => {
  return (
    <Calendar.HeadCell
      {...props}
      class={cn(
        'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
        props.class,
      )}
    />
  );
};

export const CalendarCellTrigger: Component<ComponentProps<typeof Calendar.CellTrigger>> = (props) => {
  return (
    <Calendar.CellTrigger
      {...props}
      class={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm size-8 p-0 font-normal',
        'hover:bg-accent hover:text-accent-foreground transition-colors',
        'focus-visible:(outline-none ring-1.5 ring-ring)',
        'data-[selected]:(bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground)',
        'data-[today]:not([data-selected]):(bg-accent text-accent-foreground)',
        'data-[disabled]:(text-muted-foreground opacity-50)',
        '[&:not([data-corvu-calendar-celltrigger])]:(text-muted-foreground opacity-50)',
        props.class,
      )}
    />
  );
};

export function CalendarGrid(props: {
  class?: string;
  formatDay?: (day: Date) => string;
  formatWeekday?: (day: Date) => string;
}) {
  const context = Calendar.useContext();

  return (
    <Calendar.Table class={cn('w-full border-collapse space-y-1', props.class)}>
      <thead>
        <tr class="flex">
          <For each={context.weekdays()}>
            {weekday => (
              <CalendarHeadCell>
                {props.formatWeekday?.(weekday) ?? weekday.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}
              </CalendarHeadCell>
            )}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={context.weeks()}>
          {week => (
            <tr class="flex w-full mt-1">
              <For each={week}>
                {day => (
                  <Calendar.Cell>
                    <CalendarCellTrigger day={day}>
                      {props.formatDay?.(day) ?? day.getDate()}
                    </CalendarCellTrigger>
                  </Calendar.Cell>
                )}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </Calendar.Table>
  );
}
