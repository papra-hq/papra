import { Stack } from 'expo-router';
import { OrganizationsProvider } from '@/modules/organizations/organizations.provider';

export default function WithOrganizationsLayout() {
  return (
    <OrganizationsProvider>
      <Stack>
        <Stack.Screen name="organizations/create" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </OrganizationsProvider>
  );
}
