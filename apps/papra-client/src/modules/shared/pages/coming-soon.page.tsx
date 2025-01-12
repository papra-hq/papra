import type { Component } from 'solid-js';

export const ComingSoonPage: Component = () => {
  return (
    <div class="flex flex-col items-center justify-center gap-2 pt-24">
      <div class="i-tabler-alarm text-primary size-12" />
      <div class="text-xl font-medium">Coming Soon</div>
      <div class="text-sm  text-muted-foreground">This feature is coming soon, please check back later.</div>
    </div>
  );
};
