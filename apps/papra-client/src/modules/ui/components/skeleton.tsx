import { cn } from '@/modules/shared/style/cn';
import { type ComponentProps, splitProps } from 'solid-js';

export function Skeleton(props: ComponentProps<'div'>) {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('animate-pulse rounded-md bg-primary/10', local.class)}
      {...rest}
    />
  );
}
