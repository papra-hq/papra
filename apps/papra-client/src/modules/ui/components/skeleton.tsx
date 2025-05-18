import type { ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export function Skeleton(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('animate-pulse rounded-md bg-primary/10', local.class)}
      {...rest}
    />
  );
}
