import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { ToggleButtonRootProps } from '@kobalte/core/toggle-button';
import type { VariantProps } from 'class-variance-authority';
import type { ValidComponent } from 'solid-js';
import { ToggleButton as ToggleButtonPrimitive } from '@kobalte/core/toggle-button';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors transition-property-[box-shadow,color,background-color] hover:(bg-muted text-muted-foreground) focus-visible:(outline-none ring-1.5 ring-ring) disabled:(pointer-events-none opacity-50) data-[pressed]:(bg-accent text-accent-foreground) transition-shadow',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent shadow-sm hover:(bg-accent text-accent-foreground)',
      },
      size: {
        default: 'h-9 px-3',
        sm: 'h-8 px-2',
        lg: 'h-10 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type toggleButtonProps<T extends ValidComponent = 'button'> =
  ToggleButtonRootProps<T> &
  VariantProps<typeof toggleVariants> & {
    class?: string;
  };

export function ToggleButton<T extends ValidComponent = 'button'>(props: PolymorphicProps<T, toggleButtonProps<T>>) {
  const [local, rest] = splitProps(props as toggleButtonProps, [
    'class',
    'variant',
    'size',
  ]);

  return (
    <ToggleButtonPrimitive
      class={cn(
        toggleVariants({ variant: local.variant, size: local.size }),
        local.class,
      )}
      {...rest}
    />
  );
}
