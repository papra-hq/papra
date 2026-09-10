import { createSignal, Show } from 'solid-js';
import { isDemoMode } from '@/modules/config/config';
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchLabel,
  SwitchThumb,
} from '@/modules/ui/components/switch';
import { useDevtools } from '../../devtools.context';

export function DemoModeDevtool() {
  const { registerTool } = useDevtools();

  registerTool({
    id: 'demo-mode',
    title: 'Demo mode',
    icon: 'i-tabler-presentation',
    order: 100,
    component: DemoModeTool,
  });

  return null;
}

function DemoModeTool() {
  const isForcedByEnvironment = import.meta.env.VITE_IS_DEMO_MODE === 'true';
  const [getError, setError] = createSignal<string>();

  const toggleDemoMode = (value: boolean) => {
    try {
      localStorage.setItem('papra:dev:demo-mode', String(value));
      window.location.reload();
    } catch {
      setError('Could not save the preference. Allow local storage in your browser and try again.');
    }
  };

  return (
    <div class="space-y-5">
      <div>
        <h3 class="text-base font-semibold">Demo mode</h3>
        <p class="mt-1 text-muted-foreground">
          Try Papra with local demo data, without a running server.
        </p>
      </div>

      <Switch
        checked={isDemoMode}
        disabled={isForcedByEnvironment}
        onChange={toggleDemoMode}
        class="flex items-center justify-between gap-4 rounded-xl border p-4"
      >
        <div class="space-y-1">
          <SwitchLabel class="font-medium">Enable demo mode</SwitchLabel>
          <SwitchDescription class="text-xs text-muted-foreground">
            Saved for this browser. Changing this reloads the page.
          </SwitchDescription>
        </div>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <Show when={isForcedByEnvironment}>
        <p class="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          Enabled by VITE_IS_DEMO_MODE. The local override can enable demo mode, but cannot disable
          an environment-forced demo.
        </p>
      </Show>
      <Show when={getError()}>
        <p role="alert" class="text-sm text-destructive">
          {getError()}
        </p>
      </Show>
    </div>
  );
}
