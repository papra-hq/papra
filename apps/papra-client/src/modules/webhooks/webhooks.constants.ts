export const WEBHOOK_EVENTS = [
  {
    section: 'documents',
    events: [
      'document:created',
      'document:deleted',
    ],
  },

] as const;

export const WEBHOOK_EVENT_NAMES = WEBHOOK_EVENTS.flatMap(event => event.events);
