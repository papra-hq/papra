export const WEBHOOK_EVENTS = [
  {
    section: 'documents',
    events: [
      'document:created',
      'document:deleted',
      'document:updated',
      'document:tag:added',
      'document:tag:removed',
    ],
  },

] as const;

export const WEBHOOK_EVENT_NAMES = WEBHOOK_EVENTS.flatMap(event => event.events);
