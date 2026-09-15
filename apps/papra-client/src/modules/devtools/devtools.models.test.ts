import type { Devtool } from './devtools.models';
import { createRoot } from 'solid-js';
import { describe, expect, test } from 'vitest';
import { createDevtoolsRegistry } from './devtools.models';

const createTool = (id: string, order?: number): Devtool => ({
  id,
  title: id,
  icon: 'i-tabler-code',
  order,
  component: () => null,
});

describe('devtools registry', () => {
  test('orders tools and unregisters them when their owner is disposed', () => {
    const registry = createDevtoolsRegistry();
    const dispose = createRoot((dispose) => {
      registry.registerTool(createTool('demo', 100));
      registry.registerTool(createTool('documents'));
      return dispose;
    });

    expect(registry.getTools().map(({ id }) => id)).toEqual(['documents', 'demo']);
    dispose();
    expect(registry.getTools()).toEqual([]);
  });

  test('supports explicit, idempotent unregistration', () => {
    createRoot((dispose) => {
      const registry = createDevtoolsRegistry();
      const unregister = registry.registerTool(createTool('documents'));
      unregister();
      unregister();
      expect(registry.getTools()).toEqual([]);
      dispose();
    });
  });

  test('disposing one route leaves tools from other owners registered', () => {
    const registry = createDevtoolsRegistry();
    const disposeDemo = createRoot((dispose) => {
      registry.registerTool(createTool('demo'));
      return dispose;
    });
    const disposeDocuments = createRoot((dispose) => {
      registry.registerTool(createTool('documents'));
      return dispose;
    });

    disposeDocuments();
    expect(registry.getTools().map(({ id }) => id)).toEqual(['demo']);
    disposeDemo();
  });

  test('replaces duplicate IDs without allowing stale cleanup to remove the replacement', () => {
    const registry = createDevtoolsRegistry();
    const oldTool = createTool('documents');
    const newTool = createTool('documents');
    const disposeOld = createRoot((dispose) => {
      registry.registerTool(oldTool);
      return dispose;
    });
    const disposeNew = createRoot((dispose) => {
      registry.registerTool(newTool);
      return dispose;
    });

    expect(registry.getTools()).toEqual([newTool]);
    disposeOld();
    expect(registry.getTools()).toEqual([newTool]);
    disposeNew();
    expect(registry.getTools()).toEqual([]);
  });
});
