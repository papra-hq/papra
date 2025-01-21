import type {
  ComboboxContentProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxTriggerProps,
} from '@kobalte/core/combobox';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { JSX, ParentProps, ValidComponent, VoidProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Combobox as ComboboxPrimitive } from '@kobalte/core/combobox';
import { splitProps } from 'solid-js';

export const Combobox = ComboboxPrimitive;
export const ComboboxDescription = ComboboxPrimitive.Description;
export const ComboboxErrorMessage = ComboboxPrimitive.ErrorMessage;
export const ComboboxItemDescription = ComboboxPrimitive.ItemDescription;
export const ComboboxHiddenSelect = ComboboxPrimitive.HiddenSelect;

type comboboxInputProps<T extends ValidComponent = 'input'> = VoidProps<
  ComboboxInputProps<T> & {
    class?: string;
  }
>;

export function ComboboxInput<T extends ValidComponent = 'input'>(props: PolymorphicProps<T, comboboxInputProps<T>>) {
  const [local, rest] = splitProps(props as comboboxInputProps, ['class']);

  return (
    <ComboboxPrimitive.Input
      class={cn(
        'h-full flex-1 text-sm placeholder:text-muted-foreground focus:outline-none disabled:(cursor-not-allowed opacity-50) bg-inherit',
        local.class,
      )}
      {...rest}
    />
  );
}

type comboboxTriggerProps<T extends ValidComponent = 'button'> = ParentProps<
  ComboboxTriggerProps<T> & {
    class?: string;
    displayMultipleState?: (state: any) => JSX.Element;
  }
>;

export function ComboboxTrigger<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, comboboxTriggerProps<T>>) {
  const [local, rest] = splitProps(props as comboboxTriggerProps, [
    'class',
    'children',
  ]);

  return (
    <ComboboxPrimitive.Control>
      {state => (
        <>

          <ComboboxPrimitive.Trigger
            class={cn(
              'flex min-h-9 w-full items-center rounded-md border border-input px-3 shadow-sm bg-inherit',
              local.class,
            )}
            {...rest}
          >
            {props.displayMultipleState?.(state)}
            {local.children}
            <ComboboxPrimitive.Icon class="flex h-3.5 w-3.5 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                class="h-4 w-4 opacity-50"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m8 9l4-4l4 4m0 6l-4 4l-4-4"
                />
                <title>Arrow</title>
              </svg>
            </ComboboxPrimitive.Icon>
          </ComboboxPrimitive.Trigger>

        </>
      )}
    </ComboboxPrimitive.Control>
  );
}

type comboboxContentProps<T extends ValidComponent = 'div'> =
  ComboboxContentProps<T> & {
    class?: string;
  };

export function ComboboxContent<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, comboboxContentProps<T>>) {
  const [local, rest] = splitProps(props as comboboxContentProps, ['class']);

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Content
        class={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[expanded]:(animate-in fade-in-0 zoom-in-95) data-[closed]:(animate-out fade-out-0 zoom-out-95) origin-[--kb-combobox-content-transform-origin]',
          local.class,
        )}
        {...rest}
      >
        <ComboboxPrimitive.Listbox class="p-1" />
      </ComboboxPrimitive.Content>
    </ComboboxPrimitive.Portal>
  );
}

type comboboxItemProps<T extends ValidComponent = 'li'> = ParentProps<
  ComboboxItemProps<T> & {
    class?: string;
  }
>;

export function ComboboxItem<T extends ValidComponent = 'li'>(props: PolymorphicProps<T, comboboxItemProps<T>>) {
  const [local, rest] = splitProps(props as comboboxItemProps, [
    'class',
    'children',
  ]);

  return (
    <ComboboxPrimitive.Item
      class={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:(pointer-events-none opacity-50) data-[highlighted]:(bg-accent text-accent-foreground)',
        local.class,
      )}
      {...rest}
    >
      <ComboboxPrimitive.ItemIndicator class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="h-4 w-4"
        >
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m5 12l5 5L20 7"
          />
          <title>Checked</title>
        </svg>
      </ComboboxPrimitive.ItemIndicator>
      <ComboboxPrimitive.ItemLabel>
        {local.children}
      </ComboboxPrimitive.ItemLabel>
    </ComboboxPrimitive.Item>
  );
}
