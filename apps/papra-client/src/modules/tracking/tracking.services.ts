import posthog from 'posthog-js';
import { buildTimeConfig, isDev } from '../config/config';

type TrackingServices = {
  capture: (args: {
    event: string;
    properties?: Record<string, unknown>;
  }) => void;

  reset: () => void;

  identify: (args: {
    userId: string;
    email: string;
  }) => void;
};

const dummyTrackingServices: TrackingServices = {
  capture: ({ event, ...args }) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[dev] captured event ${event}`, args);
    }
  },
  reset: () => {},
  identify: () => {},
};

function createTrackingServices(): TrackingServices {
  const { isEnabled, apiKey, host } = buildTimeConfig.posthog;

  if (!isEnabled) {
    return dummyTrackingServices;
  }

  if (!apiKey) {
    console.warn('PostHog API key is not set');
    return dummyTrackingServices;
  }

  posthog.init(
    apiKey,
    {
      api_host: host,
      capture_pageview: false,
    },
  );

  return {
    capture: ({ event, properties }) => {
      posthog.capture(event, properties);
    },
    reset: () => {
      posthog.reset();
    },
    identify: ({ userId, email }) => {
      posthog.identify(userId, { email });
    },
  };
}

export const trackingServices = createTrackingServices();
