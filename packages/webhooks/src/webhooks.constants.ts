export const EVENT_NAMES = [
  'document:created',
  'document:deleted',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
