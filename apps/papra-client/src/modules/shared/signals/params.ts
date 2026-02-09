import { useSearchParams } from '@solidjs/router';
import { asSingleParam } from '../utils/query-params';
import { resolveSetterValue } from './setters';

export function createParamSynchronizedSignal<T extends string | number | boolean>({
  paramKey,
  defaultValue,
  serialize = value => String(value),
  deserialize = value => value as unknown as T,
}: {
  paramKey: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const getValue = () => {
    const paramValue = asSingleParam(searchParams[paramKey]);

    if (paramValue === undefined) {
      return defaultValue;
    }

    return deserialize(paramValue);
  };

  const setValue = (valueOrUpdater: T | ((prevValue: T) => T)) => {
    const newValue = resolveSetterValue(valueOrUpdater, getValue());

    setSearchParams(
      {
        [paramKey]: newValue === defaultValue ? undefined : serialize(newValue),
      },
      { replace: true },
    );
  };

  return [getValue, setValue] as const;
}
