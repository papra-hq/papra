import type { Component, ComponentProps, JSX } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { splitProps } from 'solid-js';

export const EmptyState: Component<{
  title: JSX.Element;
  icon: string;
  description: JSX.Element;
  cta?: JSX.Element;
} & ComponentProps<'div'>> = (props) => {
  const [local, rest] = splitProps(props, ['title', 'icon', 'description', 'cta', 'class']);

  return (
    <div class={cn('flex flex-col items-center justify-center gap-2 pt-24 mx-auto max-w-md text-center', local.class)} {...rest}>
      <div class={cn(props.icon, 'text-primary size-12')} aria-hidden="true" />
      <div class="text-xl font-medium">{props.title}</div>
      <div class="text-sm text-muted-foreground mb-2">{props.description}</div>
      {props.cta}
    </div>
  );
};
