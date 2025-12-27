import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { CardSkeleton } from './card-skeleton';

type gridSkeletonProps = {
  items?: number;
  columns?: number;
};

export const GridSkeleton: Component<gridSkeletonProps> = (props) => {
  const items = () => props.items ?? 6;
  const columns = () => props.columns ?? 3;

  return (
    <div
      class="grid gap-4"
      style={{
        'grid-template-columns': `repeat(${columns()}, minmax(0, 1fr))`,
      }}
    >
      <For each={Array.from({ length: items() })}>
        {() => <CardSkeleton />}
      </For>
    </div>
  );
};
