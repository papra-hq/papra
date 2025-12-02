import type { ShutdownServices } from '../app/graceful-shutdown/graceful-shutdown.services';
import type { Config } from '../config/config.types';
import { PostHog } from 'posthog-node';

export type TrackingServices = {
  captureUserEvent: (args: {
    userId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) => void;
};

export function createDummyTrackingServices(): TrackingServices {
  return {
    captureUserEvent: () => {},
  };
}

export function createTrackingServices({ config, shutdownServices }: { config: Config; shutdownServices?: ShutdownServices }): TrackingServices {
  const { apiKey, host, isEnabled } = config.tracking.posthog;

  if (!isEnabled) {
    return createDummyTrackingServices();
  }

  const trackingClient = new PostHog(
    apiKey,
    {
      host,
      disableGeoip: true,
    },
  );

  shutdownServices?.registerShutdownHandler({
    id: 'tracking-client-shutdown',
    handler: async () => trackingClient.shutdown(),
  });

  return {
    captureUserEvent: ({ userId, event, properties }) => {
      trackingClient.capture({ distinctId: userId, event, properties });
    },
  };
}
