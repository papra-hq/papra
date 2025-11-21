import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { configLocalStorage } from '@/modules/config/config.local-storage';
import { useAuthClient } from '@/modules/api/providers/api.provider';

export default function Index() {
  const query = useQuery({
    queryKey: ['api-server-url'],
    queryFn: configLocalStorage.getApiServerBaseUrl,
  });

  const authClient = useAuthClient();

  const getRedirection = () => {
    if (query.isLoading) {
      return null;
    }

    if (query.isError || query.data == null) {
      return <Redirect href="/config/server-selection" />;
    }

    if (authClient.getCookie() != null) {
      return <Redirect href="/(app)/(with-organizations)/(tabs)/list" />;
    }

    return <Redirect href="/auth/login" />;
  };

  return (
    <>
      {getRedirection()}
    </>
  );
}
