import type { ParentComponent } from 'solid-js';
import type { Config, RuntimePublicConfig } from './config';
import { useQuery } from '@tanstack/solid-query';
import { createContext, Match, Switch, useContext } from 'solid-js';
import { useI18n } from '../i18n/i18n.provider';
import { deepMerge } from '../shared/utils/object';
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
    throw new Error(
      'Config context not found, make sure you are using useConfig inside ConfigProvider',
    );
  }

  return context;
}

export const ConfigProvider: ParentComponent = (props) => {
  const { t } = useI18n();
  const query = useQuery(() => ({
    queryKey: ['config'],
    queryFn: fetchPublicConfig,
    refetchOnWindowFocus: false,
  }));

  const mergeConfigs = (runtimeConfig: RuntimePublicConfig): Config => {
    return deepMerge(buildTimeConfig, runtimeConfig);
  };

  const retry = async () => {
    const result = await query.refetch();

    if (result.error) {
      createToast({
        message: t('config.server-unreachable.retry-error.title'),
        description: t('config.server-unreachable.retry-error.description'),
        type: 'error',
      });
    }
  };

  return (
    <Switch>
      <Match when={query.error}>
        <EmptyState
          title={t('config.server-unreachable.title')}
          description={t('config.server-unreachable.description')}
          icon="i-tabler-server-spark"
          class="p-6 pt-12 sm:pt-32"
          cta={
            <Button onClick={retry} variant="outline">
              <span class="i-tabler-refresh size-4 mr-2 text-primary" />
              {t('config.server-unreachable.retry')}
            </Button>
          }
        />
      </Match>

      <Match when={query.data?.config}>
        {(getConfig) => (
          <ConfigContext.Provider value={{ config: mergeConfigs(getConfig()) }}>
            {props.children}
          </ConfigContext.Provider>
        )}
      </Match>
    </Switch>
  );
};
