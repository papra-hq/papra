export function resolveSetterValue<T>(valueOrUpdater: T | ((prevValue: T) => T), prevValue: T): T {
  return typeof valueOrUpdater === 'function' ? (valueOrUpdater as (prevValue: T) => T)(prevValue) : valueOrUpdater;
}
