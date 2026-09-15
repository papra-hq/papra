import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import { Keyboard, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export function AppSettingsButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const themeColors = useThemeColor();
  const t = useAppTranslations();
  const styles = createStyles({ themeColors });

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={() => {
        Keyboard.dismiss();
        router.push('/app-settings');
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={t.appSettings.title}
      accessibilityState={{ disabled }}
    >
      <Icon name="settings" size={20} color={themeColors.mutedForeground} />
    </TouchableOpacity>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
}
