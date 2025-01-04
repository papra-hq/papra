export { createHook, createWaitForHook };

function createHook<T = any>() {
  let callbacks: ((args: T) => void)[] = [];

  return {
    on: (callback: (args: T) => void | Promise<void>) => callbacks.push(callback),
    trigger: (args: T) => Promise.all(callbacks.map(callback => callback(args))),
    removeHandler: (callback: (args: T) => void) => {
      callbacks = callbacks.filter(cb => cb !== callback);
    },
  };
}

function createWaitForHook(): { waitFor: () => Promise<void>; trigger: () => void } {
  let resolves: (() => void)[] = [];

  return {
    waitFor: () => new Promise(resolve => resolves.push(resolve)),
    trigger: () => {
      resolves.forEach(resolve => resolve());
      resolves = [];
    },
  };
}
