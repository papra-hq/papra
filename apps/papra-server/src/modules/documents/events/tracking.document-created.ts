import type { EventServices } from '../../app/events/events.services';
import type { TrackingServices } from '../../tracking/tracking.services';
import { isDefined } from '../../shared/utils';

export function registerTrackDocumentCreatedHandler({
  eventServices,
  trackingServices,
}: {
  eventServices: EventServices;
  trackingServices: TrackingServices;
}) {
  eventServices.onEvent({
    eventName: 'document.created',
    handlerName: 'track-document-created',
    async handler({ document }) {
      if (isDefined(document.createdBy)) {
        trackingServices.captureUserEvent({ userId: document.createdBy, event: 'Document created' });
      }
    },
  });
}
