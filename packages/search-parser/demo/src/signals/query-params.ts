import { createSignal, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';

/**
 * Sync a Solid signal with a query parameter in the URL.
 * Hydration-proof: reads URL params only on the client.
 */
export function createQueryParamSignal(
  paramName: string,
  defaultValue: string = '',
): [() => string, (value: string) => void] {
  // Initialize with default value to ensure server and client start the same
  const [getValue, setValue] = createSignal<string>(defaultValue);

  // Only read from URL on the client side after mounting
  onMount(() => {
    if (!isServer) {
      const params = new URLSearchParams(window.location.search);
      const urlValue = params.get(paramName);
      if (urlValue !== null) {
        setValue(urlValue);
      }
    }
  });

  function updateUrlParam(value: string) {
    if (isServer) {
      return;
    }

    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(paramName, value);
    } else {
      url.searchParams.delete(paramName);
    }
    window.history.replaceState({}, '', url.toString());
  }

  function setParamValue(value: string) {
    setValue(value);
    updateUrlParam(value);
  }

  return [getValue, setParamValue];
}
