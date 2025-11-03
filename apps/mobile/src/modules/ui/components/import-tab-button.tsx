import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ImportDrawer } from '@/modules/documents/components/import-drawer';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '../providers/use-theme-color';
import { HapticTab } from './haptic-tab';

export function ImportTabButton() {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const themeColors = useThemeColor();

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDrawerVisible(true);
  };

  return (
    <>
      <HapticTab onPress={handlePress} style={{ flex: 1, alignItems: 'center', padding: 5 }}>
        <Icon name="plus" size={30} style={{ height: 30 }} color={themeColors.mutedForeground} />
      </HapticTab>

      <ImportDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
    </>
  );
}
