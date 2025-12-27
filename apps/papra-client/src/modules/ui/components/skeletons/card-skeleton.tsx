import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { Skeleton } from '../skeleton';

type cardSkeletonProps = {
  lines?: number;
};

export const CardSkeleton: Component<cardSkeletonProps> = (props) => {
  const lines = () => props.lines ?? 3;

  return (
    <div class="border border-border rounded-lg p-4">
      <Skeleton class="h-6 w-1/3 mb-3" />
      <div class="space-y-2">
        <For each={Array.from({ length: lines() })}>
          {(_, index) => (
            <Skeleton class={`h-4 ${index() === lines() - 1 ? 'w-2/3' : 'w-full'}`} />
          )}
        </For>
      </div>
    </div>
  );
};
