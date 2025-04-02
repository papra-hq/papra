import type { Config } from '../config/config.types';
import { PostHog } from 'posthog-node';

export type TrackingServices = {
  captureUserEvent: (args: {
    userId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) => void;

  shutdown: () => Promise<void>;
};

export function createDummyTrackingServices(): TrackingServices {
  return {
    captureUserEvent: () => {},
    shutdown: () => Promise.resolve(),
  };
}

export function createTrackingServices({ config }: { config: Config }): TrackingServices {
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

  return {
    captureUserEvent: ({ userId, event, properties }) => {
      trackingClient.capture({ distinctId: userId, event, properties });
    },
    shutdown: () => trackingClient.shutdown(),
  };
}
