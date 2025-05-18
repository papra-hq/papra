import type { AlertRootProps } from '@kobalte/core/alert';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps, ValidComponent } from 'solid-js';
import { Alert as AlertPrimitive } from '@kobalte/core/alert';
import { cva } from 'class-variance-authority';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&:has(svg)]:pl-11 [&>svg+div]:translate-y-[-3px] [&>svg]:(absolute left-4 top-4 text-foreground)',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        primary: 'bg-background text-foreground border-primary',
        muted: 'bg-muted text-muted-foreground border-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type alertProps<T extends ValidComponent = 'div'> = AlertRootProps<T> &
  VariantProps<typeof alertVariants> & {
    class?: string;
  };

export function Alert<T extends ValidComponent = 'div'>(props: PolymorphicProps<T, alertProps<T>>) {
  const [local, rest] = splitProps(props as alertProps, ['class', 'variant']);

  return (
    <AlertPrimitive
      class={cn(
        alertVariants({
          variant: props.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
}

export function AlertTitle(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('font-medium leading-5 tracking-tight', local.class)}
      {...rest}
    />
  );
}

export function AlertDescription(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div class={cn('text-sm [&_p]:leading-relaxed', local.class)} {...rest} />
  );
}
