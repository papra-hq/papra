import type { EventServices } from '../../app/events/events.services';
import type { TrackingServices } from '../../tracking/tracking.services';

export function registerTrackingUserCreatedEventHandler({ eventServices, trackingServices }: { eventServices: EventServices; trackingServices: TrackingServices }) {
  eventServices.onEvent({
    eventName: 'user.created',
    handlerName: 'tracking.register-user-created-event',
    handler: async ({ userId, email }) => {
      trackingServices.captureUserEvent({ userId, event: 'User signed up', properties: { $set: { email } } });
    },
  });
}
