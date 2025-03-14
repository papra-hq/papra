import { useCurrentMatches } from '@solidjs/router';
import { type Component, createEffect, on } from 'solid-js';
import { trackingServices } from '../tracking.services';

export const PageViewTracker: Component = () => {
  const matches = useCurrentMatches();

  createEffect(on(matches, () => {
    trackingServices.capture({ event: '$pageview' });
  }));

  return null;
};
