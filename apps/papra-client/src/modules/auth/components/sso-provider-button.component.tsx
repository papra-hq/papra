import type { Component } from 'solid-js';
import { createSignal, Match, Switch } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';

export const SsoProviderButton: Component<{ name: string; icon?: string; onClick: () => Promise<void>; label: string }> = (props) => {
  const [getIsLoading, setIsLoading] = createSignal(false);

  const onClick = async () => {
    setIsLoading(true);
    await props.onClick();
  };

  return (
    <Button variant="secondary" class="block w-full flex items-center justify-center gap-2" onClick={onClick} disabled={getIsLoading()}>

      <Switch>
        <Match when={getIsLoading()}>
          <span class="i-tabler-loader-2 animate-spin" />
        </Match>

        <Match when={props.icon?.startsWith('i-')}>
          <span class={cn(`size-4.5`, props.icon)} />
        </Match>

        <Match when={props.icon}>
          <img src={props.icon} alt={props.name} class="size-4.5" />
        </Match>
      </Switch>

      {props.label}
    </Button>
  );
};
