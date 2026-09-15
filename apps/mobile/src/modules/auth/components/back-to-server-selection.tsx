import type { ThemeColors } from '@/modules/ui/theme.constants';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export function BackToServerSelectionButton({ disabled = false }: { disabled?: boolean }) {
  const themeColors = useThemeColor();
  const t = useAppTranslations();
  const styles = createStyles({ themeColors });

  return (
    <TouchableOpacity
      style={[styles.backToServerButton, disabled && styles.buttonDisabled]}
      onPress={() => router.push('/config/server-selection')}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Icon name="arrow-left" size={20} color={themeColors.mutedForeground} />
      <Text style={styles.backToServerText}>{t.serverSelection.selectServer}</Text>
    </TouchableOpacity>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    backToServerButton: {
      flexShrink: 1,
      minHeight: 44,
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
    buttonDisabled: {
      opacity: 0.5,
    },
    backToServerText: {
      flexShrink: 1,
      color: themeColors.mutedForeground,
      fontSize: 16,
    },
  });
}
