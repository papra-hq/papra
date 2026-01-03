import type { Config } from '../../config/config.types';
import type { DocumentSearchServices } from '../../documents/document-search/document-search.types';
import type { TrackingServices } from '../../tracking/tracking.services';
import type { Database } from '../database/database.types';
import type { EventServices } from './events.services';
import { registerSyncDocumentSearchEventHandlers } from '../../documents/document-search/events/sync-document-search.handlers';
import { registerInsertActivityLogOnDocumentCreatedHandler } from '../../documents/events/activity-log.document-created';
import { registerInsertActivityLogOnDocumentRestoredHandler } from '../../documents/events/activity-log.document-restored';
import { registerInsertActivityLogOnDocumentTrashedHandler } from '../../documents/events/activity-log.document-trashed';
import { registerInsertActivityLogOnDocumentUpdatedHandler } from '../../documents/events/activity-log.document-updated';
import { registerTrackDocumentCreatedHandler } from '../../documents/events/tracking.document-created';
import { registerTriggerWebhooksOnDocumentCreatedHandler } from '../../documents/events/webhook.document-created';
import { registerTriggerWebhooksOnDocumentTrashedHandler } from '../../documents/events/webhook.document-trashed';
import { registerTriggerWebhooksOnDocumentUpdatedHandler } from '../../documents/events/webhook.document-updated';
import { registerFirstUserAdminEventHandler } from '../../roles/event-handlers/first-user-admin.user-created';
import { registerTrackingUserCreatedEventHandler } from '../../users/event-handlers/tracking.user-created';

export function registerEventHandlers(deps: { trackingServices: TrackingServices; eventServices: EventServices; db: Database; documentSearchServices: DocumentSearchServices; config: Config }) {
  registerFirstUserAdminEventHandler(deps);
  registerTrackingUserCreatedEventHandler(deps);
  registerTriggerWebhooksOnDocumentCreatedHandler(deps);
  registerInsertActivityLogOnDocumentCreatedHandler(deps);
  registerTrackDocumentCreatedHandler(deps);
  registerTriggerWebhooksOnDocumentTrashedHandler(deps);
  registerInsertActivityLogOnDocumentTrashedHandler(deps);
  registerInsertActivityLogOnDocumentRestoredHandler(deps);
  registerTriggerWebhooksOnDocumentUpdatedHandler(deps);
  registerInsertActivityLogOnDocumentUpdatedHandler(deps);
  registerSyncDocumentSearchEventHandlers(deps);
}
