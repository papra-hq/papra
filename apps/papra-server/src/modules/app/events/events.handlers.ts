import type { Config } from '../../config/config.types';
import type { DocumentSearchServices } from '../../documents/document-search/document-search.types';
import type { TrackingServices } from '../../tracking/tracking.services';
import type { WebhookTriggerServices } from '../../webhooks/webhooks.trigger.services';
import type { Database } from '../database/database.types';
import type { EventServices } from './events.services';
import { registerSyncDocumentSearchEventHandlers } from '../../documents/document-search/events/sync-document-search.handlers';
import { registerInsertActivityLogOnDocumentCreatedHandler } from '../../documents/events/activity-log.document-created';
import { registerInsertActivityLogOnDocumentRestoredHandler } from '../../documents/events/activity-log.document-restored';
import { registerInsertActivityLogOnDocumentUpdatedHandler } from '../../documents/events/activity-log.document-updated';
import { registerInsertActivityLogOnDocumentsTrashedHandler } from '../../documents/events/activity-log.documents-trashed';
import { registerTrackDocumentCreatedHandler } from '../../documents/events/tracking.document-created';
import { registerTriggerWebhooksOnDocumentCreatedHandler } from '../../documents/events/webhooks.document-created';
import { registerTriggerWebhooksOnDocumentUpdatedHandler } from '../../documents/events/webhooks.document-updated';
import { registerTriggerWebhooksOnDocumentsTrashedHandler } from '../../documents/events/webhooks.documents-trashed';
import { registerFirstUserAdminEventHandler } from '../../roles/event-handlers/first-user-admin.user-created';
import { registerTrackingUserCreatedEventHandler } from '../../users/event-handlers/tracking.user-created';

export function registerEventHandlers(deps: { trackingServices: TrackingServices; eventServices: EventServices; db: Database; documentSearchServices: DocumentSearchServices; config: Config; webhookTriggerServices: WebhookTriggerServices }) {
  registerFirstUserAdminEventHandler(deps);
  registerTrackingUserCreatedEventHandler(deps);
  registerTriggerWebhooksOnDocumentCreatedHandler(deps);
  registerInsertActivityLogOnDocumentCreatedHandler(deps);
  registerTrackDocumentCreatedHandler(deps);
  registerTriggerWebhooksOnDocumentsTrashedHandler(deps);
  registerInsertActivityLogOnDocumentsTrashedHandler(deps);
  registerInsertActivityLogOnDocumentRestoredHandler(deps);
  registerTriggerWebhooksOnDocumentUpdatedHandler(deps);
  registerInsertActivityLogOnDocumentUpdatedHandler(deps);
  registerSyncDocumentSearchEventHandlers(deps);
}
