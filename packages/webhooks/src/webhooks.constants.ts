export const EVENT_NAMES = [
  'document:created',
  'document:deleted',
  'document:updated',
  'document:tag:added',
  'document:tag:removed',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];
