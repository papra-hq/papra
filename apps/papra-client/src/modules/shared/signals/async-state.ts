import { castError } from '@corentinth/chisels';
import { identity } from 'lodash-es';
import { createSignal } from 'solid-js';
import { createHook } from '../hooks/hooks';

export { useAsyncState };

function useAsyncState<Args, Return, ReturnFormatted = Return>(
  getter: (args: Args) => Promise<Return>,
  { initialData, formatValue = identity, immediate = false }: { initialData?: ReturnFormatted; formatValue?: (value: Return) => ReturnFormatted; immediate?: boolean } = {},
) {
  const [getIsLoading, setIsLoading] = createSignal(false);
  const [getError, setError] = createSignal<Error | undefined>(undefined);
  const [getData, setData] = createSignal<ReturnFormatted | undefined>(initialData);
  const [getStatus, setStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle');

  const successHook = createHook<{ data: Return; args: Args }>();
  const errorHook = createHook<{ error: Error; args: Args }>();
  const finishHook = createHook<{ data: ReturnFormatted | undefined; error: Error | undefined; args: Args }>();

  const execute = async (args: Args) => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const data = await getter(args);

      // eslint-disable-next-line ts/no-unsafe-function-type
      setData(formatValue(data) as Exclude<ReturnFormatted, Function>);
      setError(undefined);
      setStatus('success');
      successHook.trigger({ data, args });
      return data;
    } catch (err) {
      const error = castError(err);

      console.error(error);

      setData(undefined);
      setError(error);
      setStatus('error');
      errorHook.trigger({ error, args });
    } finally {
      setIsLoading(false);
      finishHook.trigger({ data: getData(), error: getError(), args });
    }
  };

  if (immediate) {
    execute({} as Args);
  }

  return {
    getIsLoading,
    getError,
    getData,
    getStatus,
    execute,
    onSuccess: successHook.on,
    onError: errorHook.on,
    onFinish: finishHook.on,
  };
}
