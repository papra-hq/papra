import { buildTimeConfig } from '@/modules/config/config';
import { buildUrl } from '@corentinth/chisels';
import { useCurrentMatches } from '@solidjs/router';
import Plausible from 'plausible-tracker';
import { type Component, createEffect } from 'solid-js';

export const PlausibleTracker: Component = () => {
  const { isEnabled, apiHost, domain } = buildTimeConfig.plausible;

  if (!isEnabled) {
    return null;
  }

  const plausible = Plausible({
    domain,
    apiHost,
    trackLocalhost: false,
  });

  const matches = useCurrentMatches();

  createEffect(() => {
    const basePattern = matches().at(-1)?.route.pattern ?? '/';
    const pattern = basePattern === '*404' ? window.location.pathname : basePattern;

    const url = buildUrl({
      path: pattern,
      baseUrl: window.location.origin,
    });

    plausible.trackPageview({ url });
  });

  return null;
};
