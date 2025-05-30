export const DOCUMENT_ACTIVITY_EVENTS = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  RESTORED: 'restored',
  TAGGED: 'tagged',
  UNTAGGED: 'untagged',
} as const;

export const DOCUMENT_ACTIVITY_EVENT_LIST = Object.values(DOCUMENT_ACTIVITY_EVENTS);
