export const nextTick = async () => new Promise<void>(resolve => setImmediate(resolve));
