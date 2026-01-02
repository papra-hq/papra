import type { DynamicProps, RootProps } from '@corvu/otp-field';
import type { Component, ComponentProps, ValidComponent } from 'solid-js';

import OtpField from '@corvu/otp-field';
import { Show, splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const REGEXP_ONLY_DIGITS = '^\\d*$';
export const REGEXP_ONLY_CHARS = '^[a-zA-Z]*$';
export const REGEXP_ONLY_DIGITS_AND_CHARS = '^[a-zA-Z0-9]*$';

type OTPFieldProps<T extends ValidComponent = 'div'> = RootProps<T> & { class?: string };

function OTPField<T extends ValidComponent = 'div'>(props: DynamicProps<T, OTPFieldProps<T>>) {
  const [local, others] = splitProps(props as OTPFieldProps, ['class']);
  return (
    <OtpField
      class={cn(
        'flex items-center gap-2 disabled:cursor-not-allowed has-[:disabled]:opacity-50',
        local.class,
      )}
      {...others}
    />
  );
}

const OTPFieldInput = OtpField.Input;

const OTPFieldGroup: Component<ComponentProps<'div'>> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return <div class={cn('flex items-center', local.class)} {...others} />;
};

const OTPFieldSlot: Component<ComponentProps<'div'> & { index: number }> = (props) => {
  const [local, others] = splitProps(props, ['class', 'index']);
  const context = OtpField.useContext();
  const char = () => context.value()[local.index];
  const showFakeCaret = () => context.value().length === local.index && context.isInserting();

  return (
    <div
      class={cn(
        'group relative flex size-10 items-center justify-center border-y border-r border-input text-sm first:rounded-l-md first:border-l last:rounded-r-md',
        local.class,
      )}
      {...others}
    >
      <div
        class={cn(
          'absolute inset-0 z-10 transition-all group-first:rounded-l-md group-last:rounded-r-md',
          context.activeSlots().includes(local.index) && 'ring-2 ring-ring ring-offset-background',
        )}
      />
      {char()}
      <Show when={showFakeCaret()}>
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      </Show>
    </div>
  );
};

const OTPFieldSeparator: Component<ComponentProps<'div'>> = (props) => {
  return (
    <div {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-6"
      >
        <circle cx="12.1" cy="12.1" r="1" />
      </svg>
    </div>
  );
};

export { OTPField, OTPFieldGroup, OTPFieldInput, OTPFieldSeparator, OTPFieldSlot };
