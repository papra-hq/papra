export function createUnrefTimeout(cb: () => void, delay: number): NodeJS.Timeout {
  const timeout = setTimeout(cb, delay);
  timeout.unref?.();
  return timeout;
}
