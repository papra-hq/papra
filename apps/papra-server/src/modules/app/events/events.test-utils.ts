import type { EventServices } from './events.services';

export function createTestEventServices() {
  const emittedEvents: { eventName: string; payload: Record<string, unknown> }[] = [];

  const services = {
    onEvent() {},
    emitEvent({ eventName, payload }) {
      emittedEvents.push({ eventName, payload });
    },
  } satisfies EventServices;

  return {
    ...services,
    getEmittedEvents() {
      return emittedEvents;
    },
  };
}
