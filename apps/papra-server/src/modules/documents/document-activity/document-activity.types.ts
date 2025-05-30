import type { DOCUMENT_ACTIVITY_EVENTS } from './document-activity.constants';

export type DocumentActivityEvent = (typeof DOCUMENT_ACTIVITY_EVENTS)[keyof typeof DOCUMENT_ACTIVITY_EVENTS];
