import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { createAuthClient } from '@/modules/auth/auth.client';
import { configQueryOptions } from '@/modules/config/config.queries';

if (__DEV__) {
  // eslint-disable-next-line ts/no-require-imports
  require('./ReactotronConfig');
}

export default function Index() {
  const query = useQuery(configQueryOptions);

  const getRedirection = () => {
    if (query.isLoading) {
      return null;
    }

    if (query.isError || query.data == null) {
      return <Redirect href="/config/server-selection" />;
    }

    const authClient = createAuthClient(query.data);
    if (authClient.getCookie()) {
      return <Redirect href="/(app)/(with-organizations)/(tabs)/list" />;
    }

    return <Redirect href="/auth/login" />;
  };

  return <>{getRedirection()}</>;
}
