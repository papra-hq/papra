import type { ParentComponent } from 'solid-js';
import type { Config, RuntimePublicConfig } from './config';
import { useQuery } from '@tanstack/solid-query';
import { merge } from 'lodash-es';
import { createContext, Match, Switch, useContext } from 'solid-js';
import { Button } from '../ui/components/button';
import { EmptyState } from '../ui/components/empty';
import { createToast } from '../ui/components/sonner';
import { buildTimeConfig } from './config';
import { fetchPublicConfig } from './config.services';

const ConfigContext = createContext<{
  config: Config;
}>();

export function useConfig() {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error('Config context not found, make sure you are using useConfig inside ConfigProvider');
  }

  return context;
}

export const ConfigProvider: ParentComponent = (props) => {
  const query = useQuery(() => ({
    queryKey: ['config'],
    queryFn: fetchPublicConfig,
  }));

  const mergeConfigs = (runtimeConfig: RuntimePublicConfig): Config => {
    return merge({}, buildTimeConfig, runtimeConfig);
  };

  const retry = async () => {
    const result = await query.refetch();

    if (result.error) {
      createToast({
        message: 'Server still unreachable',
        description: 'The server remains unreachable, try again later.',
        type: 'error',
      });
    }
  };

  return (
    <Switch>
      <Match when={query.error}>
        <EmptyState
          title="Server unreachable"
          description="The server seems to be unreachable, if you are self-hosting, make sure the server is running and properly configured. You may want to check the console for more information."
          icon="i-tabler-server-spark"
          class="p-6 pt-12 sm:pt-32"
          cta={(
            <Button
              onClick={retry}
              variant="outline"
            >
              <span class="i-tabler-refresh size-4 mr-2 text-primary" />
              Retry
            </Button>
          )}
        />
      </Match>

      <Match when={query.data?.config}>
        {getConfig => (
          <ConfigContext.Provider value={{ config: mergeConfigs(getConfig()) }}>
            {props.children}
          </ConfigContext.Provider>
        )}
      </Match>
    </Switch>
  );
};
