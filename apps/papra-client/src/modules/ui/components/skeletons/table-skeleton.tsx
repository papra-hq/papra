import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { Skeleton } from '../skeleton';

type tableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export const TableSkeleton: Component<tableSkeletonProps> = (props) => {
  const rows = () => props.rows ?? 5;
  const columns = () => props.columns ?? 4;

  return (
    <div class="w-full">
      <For each={Array.from({ length: rows() })}>
        {() => (
          <div class="flex gap-4 py-3 border-b border-border/80">
            <For each={Array.from({ length: columns() })}>
              {(_, index) => (
                <div class={index() === 0 ? 'flex-1' : 'w-24'}>
                  <Skeleton class="h-5 w-full" />
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};
