import type { TrackingServices } from '../../tracking/tracking.services';
import type { EventServices } from './events.services';
import { registerTrackingUserCreatedEventHandler } from '../../users/event-handlers/tracking.user-created';

export function registerEventHandlers(deps: { trackingServices: TrackingServices; eventServices: EventServices }) {
  registerTrackingUserCreatedEventHandler(deps);
}
