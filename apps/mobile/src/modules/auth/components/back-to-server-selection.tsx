import type { ThemeColors } from '@/modules/ui/theme.constants';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export function BackToServerSelectionButton() {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });

  return (
    <TouchableOpacity
      style={styles.backToServerButton}
      onPress={() => router.push('/config/server-selection')}
    >
      <Icon name="arrow-left" size={20} color={themeColors.mutedForeground} />
      <Text style={styles.backToServerText}>
        Select server
      </Text>
    </TouchableOpacity>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    backToServerButton: {
      marginBottom: 16,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    backToServerText: {
      color: themeColors.mutedForeground,
      fontSize: 16,
    },
  });
}
