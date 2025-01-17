import type { ParentComponent } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { merge } from 'lodash-es';
import { createContext, Show, useContext } from 'solid-js';
import { buildTimeConfig, type Config, type RuntimePublicConfig } from './config';
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
  const query = createQuery(() => ({
    queryKey: ['config'],
    queryFn: fetchPublicConfig,
  }));

  const mergeConfigs = (runtimeConfig: RuntimePublicConfig): Config => {
    return merge({}, buildTimeConfig, runtimeConfig);
  };

  return (
    <Show when={query.data?.config}>
      {getConfig => (
        <ConfigContext.Provider value={{ config: mergeConfigs(getConfig()) }}>
          {props.children}
        </ConfigContext.Provider>
      )}
    </Show>
  );
};
