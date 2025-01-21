import type { Component, JSX } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const EmptyState: Component<{
  title: JSX.Element;
  icon: string;
  description: JSX.Element;
  cta?: JSX.Element;
}> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center gap-2 pt-24 mx-auto max-w-md text-center">
      <div class={cn(props.icon, 'text-primary size-12')} aria-hidden="true" />
      <div class="text-xl font-medium">{props.title}</div>
      <div class="text-sm text-muted-foreground mb-2">{props.description}</div>
      {props.cta}
    </div>
  );
};
