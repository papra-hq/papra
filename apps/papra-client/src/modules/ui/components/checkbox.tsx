import type { CheckboxControlProps } from '@kobalte/core/checkbox';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { JSX, ValidComponent, VoidProps } from 'solid-js';
import { Checkbox as CheckboxPrimitive } from '@kobalte/core/checkbox';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const CheckboxLabel = CheckboxPrimitive.Label;
export const Checkbox = CheckboxPrimitive;
export const CheckboxErrorMessage = CheckboxPrimitive.ErrorMessage;
export const CheckboxDescription = CheckboxPrimitive.Description;

type checkboxControlProps<T extends ValidComponent = 'div'> = VoidProps<
  CheckboxControlProps<T> & {
    class?: string;
    inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
  }
>;

export function CheckboxControl<T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, checkboxControlProps<T>>,
) {
  const [local, rest] = splitProps(props, ['class', 'children', 'inputProps']);

  return (
    <>
      <CheckboxPrimitive.Input
        class="[&:focus-visible+div]:(outline-none ring-1.5 ring-ring ring-offset-2 ring-offset-background)"
        {...local.inputProps}
      />
      <CheckboxPrimitive.Control
        class={cn(
          'h-4 w-4 shrink-0 rounded-sm border focus-visible:(outline-none ring-1.5 ring-ring) data-[disabled]:(cursor-not-allowed opacity-50) data-[checked]:(bg-primary text-primary-foreground border-primary) data-[indeterminate]:(text-primary border-primary)',
          local.class,
        )}
        {...(rest as any)}
      >
        <CheckboxPrimitive.Indicator class="flex items-center justify-center text-current group">
          <span class="i-tabler-check hidden group-data-[checked]:block" />
          <span class="i-tabler-minus hidden group-data-[indeterminate]:block" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
    </>
  );
}
