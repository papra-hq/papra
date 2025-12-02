import { createNoopLogger } from '@crowlog/logger';
import { describe, expect, test } from 'vitest';
import { nextTick } from '../../shared/async/defer.test-utils';
import { createEventServices } from './events.services';

type TestEvents = {
  'user.created': { userId: string; email: string };
  'user.deleted': { userId: string };
};

describe('events services', () => {
  describe('emitEvent', () => {
    test('registered handlers are called with the event payload when an event is emitted', async () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });
      const handlerCalls: unknown[] = [];

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'test-handler',
        handler: async (payload, meta) => {
          handlerCalls.push({ payload, meta });
        },
      });

      eventsServices.emitEvent({
        eventName: 'user.created',
        payload: { userId: '123', email: 'test@example.com' },
        eventId: 'evt_test',
        now: new Date('2024-01-01'),
      });

      expect(handlerCalls).to.deep.equal([]);

      await nextTick();

      expect(handlerCalls).to.deep.equal([{
        payload: { userId: '123', email: 'test@example.com' },
        meta: { emittedAt: new Date('2024-01-01'), eventId: 'evt_test' },
      }]);
    });

    test('multiple handlers registered for the same event are all called', async () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });
      const handlerCalls: unknown[] = [];

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'handler-1',
        handler: async (payload) => {
          handlerCalls.push({ handler: 'handler-1', payload });
        },
      });

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'handler-2',
        handler: async (payload) => {
          handlerCalls.push({ handler: 'handler-2', payload });
        },
      });

      eventsServices.emitEvent({
        eventName: 'user.created',
        payload: { userId: '456', email: 'test2@example.com' },
        eventId: 'evt_multi',
        now: new Date('2024-02-01'),
      });

      await nextTick();

      expect(handlerCalls).to.have.length(2);
      expect(handlerCalls).to.deep.include({ handler: 'handler-1', payload: { userId: '456', email: 'test2@example.com' } });
      expect(handlerCalls).to.deep.include({ handler: 'handler-2', payload: { userId: '456', email: 'test2@example.com' } });
    });

    test('emitting an event with no registered handlers does not throw an error', async () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });

      expect(async () => {
        eventsServices.emitEvent({
          eventName: 'user.deleted',
          payload: { userId: '789' },
          eventId: 'evt_no_handlers',
          now: new Date('2024-03-01'),
        });

        await nextTick();
      }).to.not.throw();
    });

    test('handlers are only called for their specific registered event', async () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });
      const handlerCalls: unknown[] = [];

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'created-handler',
        handler: async () => {
          handlerCalls.push('created');
        },
      });

      eventsServices.onEvent({
        eventName: 'user.deleted',
        handlerName: 'deleted-handler',
        handler: async () => {
          handlerCalls.push('deleted');
        },
      });

      eventsServices.emitEvent({
        eventName: 'user.created',
        payload: { userId: '111', email: 'test@example.com' },
        eventId: 'evt_created',
        now: new Date('2024-04-01'),
      });

      await nextTick();

      expect(handlerCalls).to.deep.equal(['created']);
    });

    test('handler errors are caught and do not crash the application', async () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });
      const handlerCalls: unknown[] = [];

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'failing-handler',
        handler: async () => {
          throw new Error('Handler failed');
        },
      });

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'successful-handler',
        handler: async () => {
          handlerCalls.push('success');
        },
      });

      eventsServices.emitEvent({
        eventName: 'user.created',
        payload: { userId: '222', email: 'error@example.com' },
        eventId: 'evt_error',
        now: new Date('2024-05-01'),
      });

      await nextTick();

      expect(handlerCalls).to.deep.equal(['success']);
    });
  });

  describe('onEvent', () => {
    test('registering a handler with a duplicate name for the same event throws an error', () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'duplicate-handler',
        handler: async () => {},
      });

      expect(() => {
        eventsServices.onEvent({
          eventName: 'user.created',
          handlerName: 'duplicate-handler',
          handler: async () => {},
        });
      }).to.throw('Duplicate handler name "duplicate-handler" for event "user.created"');
    });

    test('the same handler name can be used for different events', () => {
      const eventsServices = createEventServices<TestEvents>({ logger: createNoopLogger() });

      eventsServices.onEvent({
        eventName: 'user.created',
        handlerName: 'shared-handler-name',
        handler: async () => {},
      });

      expect(() => {
        eventsServices.onEvent({
          eventName: 'user.deleted',
          handlerName: 'shared-handler-name',
          handler: async () => {},
        });
      }).to.not.throw();
    });
  });
});
