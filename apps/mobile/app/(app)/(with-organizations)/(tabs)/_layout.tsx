import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/modules/ui/components/haptic-tab';
import { Icon } from '@/modules/ui/components/icon';
import { ImportTabButton } from '@/modules/ui/components/import-tab-button';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export default function TabLayout() {
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.secondaryBackground,
          borderTopColor: colors.border,
          paddingTop: 15,
          paddingBottom: insets.bottom,
          height: 65 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="list"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <Icon name="home" size={30} color={color} style={{ height: 30 }} />,
          tabBarLabel: () => null,

        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          tabBarButton: () => <ImportTabButton />,
          tabBarLabel: () => null,

        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon name="settings" size={30} color={color} style={{ height: 30 }} />,
          tabBarLabel: () => null,

        }}
      />
    </Tabs>
  );
}
