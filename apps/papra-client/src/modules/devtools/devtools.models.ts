import type { Component } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';

export type Devtool = {
  id: string;
  title: string;
  icon: string;
  order?: number;
  component: Component;
};

export function createDevtoolsRegistry() {
  const [getTools, setTools] = createSignal<Devtool[]>([]);

  // Register during component setup so tools disappear with their owning provider/route.
  const registerTool = (tool: Devtool) => {
    setTools((tools) => [...tools.filter(({ id }) => id !== tool.id), tool]);

    const unregisterTool = () => {
      // An old registration must not remove a newer tool with the same ID (e.g. HMR).
      setTools((tools) => tools.filter((registeredTool) => registeredTool !== tool));
    };

    onCleanup(unregisterTool);
    return unregisterTool;
  };

  return {
    getTools: () => getTools().toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    registerTool,
  };
}
