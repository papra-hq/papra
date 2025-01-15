import type { Component } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { createSignal } from 'solid-js';

export const SsoProviderButton: Component<{ name: string; icon: string; onClick: () => Promise<void>; label: string }> = (props) => {
  const [getIsLoading, setIsLoading] = createSignal(false);

  const navigateToProvider = async () => {
    setIsLoading(true);
    await props.onClick();
  };

  return (
    <Button variant="secondary" class="block w-full flex items-center justify-center" onClick={navigateToProvider} disabled={getIsLoading()}>
      <span class={cn(`mr-2 size-4.5 inline-block`, getIsLoading() ? 'i-tabler-loader-2 animate-spin' : props.icon)} />
      {props.label}
    </Button>
  );
};
