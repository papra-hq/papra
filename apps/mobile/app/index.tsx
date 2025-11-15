import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { configLocalStorage } from '@/modules/config/config.local-storage';

export default function Index() {
  const query = useQuery({
    queryKey: ['api-server-url'],
    queryFn: configLocalStorage.getApiServerBaseUrl,
  });

  const getRedirection = () => {
    if (query.isLoading) {
      return null;
    }

    if (query.isError || query.data == null) {
      return <Redirect href="/config/server-selection" />;
    }

    return <Redirect href="/auth/login" />;
  };

  return (
    <>
      {getRedirection()}
    </>
  );
}
