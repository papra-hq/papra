import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImportDrawer } from '@/modules/documents/components/import-drawer';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export function ImportTabButton(props: BottomTabBarButtonProps) {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const themeColors = useThemeColor();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDrawerVisible(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={[styles.container, props.style]}
      >
        <View style={[styles.button, { backgroundColor: themeColors.primary, marginBottom: 20 + insets.bottom }]}>
          <Icon name="plus" size={32} color={themeColors.primaryForeground} style={{ height: 32 }} />
        </View>
      </Pressable>

      <ImportDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
    </>
  );
}
