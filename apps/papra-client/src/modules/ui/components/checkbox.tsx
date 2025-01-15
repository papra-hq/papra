import type { CheckboxControlProps } from '@kobalte/core/checkbox';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { JSX, ValidComponent, VoidProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Checkbox as CheckboxPrimitive } from '@kobalte/core/checkbox';
import { splitProps } from 'solid-js';

export const CheckboxLabel = CheckboxPrimitive.Label;
export const Checkbox = CheckboxPrimitive;
export const CheckboxErrorMessage = CheckboxPrimitive.ErrorMessage;
export const CheckboxDescription = CheckboxPrimitive.Description;

type checkboxControlProps<T extends ValidComponent = 'div'> = VoidProps<CheckboxControlProps<T> & { class?: string; inputProps?: JSX.InputHTMLAttributes<HTMLInputElement> }>;

export function CheckboxControl<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, checkboxControlProps<T>>) {
  const [local, rest] = splitProps(
    props,
    ['class', 'children', 'inputProps'],
  );

  return (
    <>
      <CheckboxPrimitive.Input class="[&:focus-visible+div]:(outline-none ring-1.5 ring-ring ring-offset-2 ring-offset-background)" {...local.inputProps} />
      <CheckboxPrimitive.Control
        class={cn(
          'h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:(outline-none ring-1.5 ring-ring) data-[disabled]:(cursor-not-allowed opacity-50) data-[checked]:(bg-primary text-primary-foreground) transition-shadow',
          local.class,
        )}
        {...rest as any}
      >
        <CheckboxPrimitive.Indicator class="flex items-center justify-center text-current">
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
            <title>Checkbox</title>
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
    </>
  );
}
