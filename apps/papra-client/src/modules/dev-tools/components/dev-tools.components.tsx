import type { Component } from 'solid-js';
import { lazy, Show } from 'solid-js';

const DevToolsOverlay = lazy(() => import('./dev-tools-overlay.component').then(m => ({ default: m.DevToolsOverlayComponent })));

export const DevTools: Component = () => {
  return (
    <Show when={import.meta.env.DEV}>
      <DevToolsOverlay />
    </Show>
  );
};
