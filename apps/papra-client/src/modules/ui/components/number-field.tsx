import type {
  NumberFieldDecrementTriggerProps,
  NumberFieldDescriptionProps,
  NumberFieldErrorMessageProps,
  NumberFieldIncrementTriggerProps,
  NumberFieldInputProps,
  NumberFieldLabelProps,
  NumberFieldRootProps,
} from '@kobalte/core/number-field';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { ComponentProps, ValidComponent, VoidProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { NumberField as NumberFieldPrimitive } from '@kobalte/core/number-field';
import { splitProps } from 'solid-js';
import { textfieldLabel } from './textfield';

export const NumberFieldHiddenInput = NumberFieldPrimitive.HiddenInput;

type numberFieldLabelProps<T extends ValidComponent = 'div'> = NumberFieldLabelProps<T> & { class?: string };

export function NumberFieldLabel<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, numberFieldLabelProps<T>>) {
  const [local, rest] = splitProps(props as numberFieldLabelProps, ['class']);

  return (
    <NumberFieldPrimitive.Label
      class={cn(textfieldLabel({ label: true }), local.class)}
      {...rest}
    />
  );
}

type numberFieldDescriptionProps<T extends ValidComponent = 'div'> = NumberFieldDescriptionProps<T> & { class?: string };

export function NumberFieldDescription<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, numberFieldDescriptionProps<T>>) {
  const [local, rest] = splitProps(props as numberFieldDescriptionProps, ['class']);

  return (
    <NumberFieldPrimitive.Description
      class={cn(
        textfieldLabel({ description: true, label: false }),
        local.class,
      )}
      {...rest}
    />
  );
}

type numberFieldErrorMessageProps<T extends ValidComponent = 'div'> = NumberFieldErrorMessageProps<T> & { class?: string };

export function NumberFieldErrorMessage<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, numberFieldErrorMessageProps<T>>) {
  const [local, rest] = splitProps(props as numberFieldErrorMessageProps, [
    'class',
  ]);

  return (
    <NumberFieldPrimitive.ErrorMessage
      class={cn(textfieldLabel({ error: true }), local.class)}
      {...rest}
    />
  );
}

type numberFieldProps<T extends ValidComponent = 'div'> =
  NumberFieldRootProps<T> & {
    class?: string;
  };

export function NumberField<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, numberFieldProps<T>>) {
  const [local, rest] = splitProps(props as numberFieldProps, ['class']);

  return (
    <NumberFieldPrimitive class={cn('grid gap-1.5', local.class)} {...rest} />
  );
}

export function NumberFieldGroup(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'relative focus-within:(outline-none ring-1.5 ring-ring) transition-shadow rounded-md',
        local.class,
      )}
      {...rest}
    />
  );
}

type numberFieldInputProps<T extends ValidComponent = 'input'> =
  NumberFieldInputProps<T> & {
    class?: string;
  };

export function NumberFieldInput<T extends ValidComponent = 'input'>(props: PolymorphicProps<T, VoidProps<numberFieldInputProps<T>>>) {
  const [local, rest] = splitProps(props as numberFieldInputProps, ['class']);

  return (
    <NumberFieldPrimitive.Input
      class={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-10 py-1 text-sm text-center shadow-sm placeholder:text-muted-foreground disabled:(cursor-not-allowed opacity-50) focus-visible:outline-none',
        local.class,
      )}
      {...rest}
    />
  );
}

type numberFieldDecrementTriggerProps<T extends ValidComponent = 'button'> = VoidProps<NumberFieldDecrementTriggerProps<T> & { class?: string }>;

export function NumberFieldDecrementTrigger<T extends ValidComponent = 'button',>(props: PolymorphicProps<T, VoidProps<numberFieldDecrementTriggerProps<T>>>) {
  const [local, rest] = splitProps(props as numberFieldDecrementTriggerProps, ['class']);

  return (
    <NumberFieldPrimitive.DecrementTrigger
      class={cn(
        'absolute top-1/2 -translate-y-1/2 left-0 p-3 disabled:(cursor-not-allowed opacity-20)',
        local.class,
      )}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-4"
        viewBox="0 0 24 24"
      >
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 12h14"
        />
        <title>Decrease number</title>
      </svg>
    </NumberFieldPrimitive.DecrementTrigger>
  );
}

type numberFieldIncrementTriggerProps<T extends ValidComponent = 'button'> = VoidProps< NumberFieldIncrementTriggerProps<T> & { class?: string }>;

export function NumberFieldIncrementTrigger< T extends ValidComponent = 'button',>(props: PolymorphicProps<T, numberFieldIncrementTriggerProps<T>>) {
  const [local, rest] = splitProps(props as numberFieldIncrementTriggerProps, ['class']);

  return (
    <NumberFieldPrimitive.IncrementTrigger
      class={cn(
        'absolute top-1/2 -translate-y-1/2 right-0 disabled:(cursor-not-allowed opacity-20) p-3',
        local.class,
      )}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="size-4"
        viewBox="0 0 24 24"
      >
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 5v14m-7-7h14"
        />
        <title>Increase number</title>
      </svg>
    </NumberFieldPrimitive.IncrementTrigger>
  );
}
