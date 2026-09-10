import type { createDevtoolsRegistry } from './devtools.models';
import { createContext, useContext } from 'solid-js';

export const DevtoolsContext = createContext<
  ReturnType<typeof createDevtoolsRegistry> & {
    closeDevtools: () => void;
  }
>();

export function useDevtools() {
  const context = useContext(DevtoolsContext);

  if (!context) {
    throw new Error('useDevtools must be used within DevtoolsProvider');
  }

  return context;
}
