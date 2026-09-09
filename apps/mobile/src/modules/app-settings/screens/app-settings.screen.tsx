import type { LocalePreference } from '@/modules/i18n/i18n.local-storage';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { useLocale } from '@/modules/i18n/hooks/use-locale';
import { LOCALE_KEYS, locales } from '@/modules/i18n/locales';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export function AppSettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const t = useAppTranslations();
  const { localePreference, setLocalePreference } = useLocale();
  const { showAlert } = useAlert();
  const [isSaving, setIsSaving] = useState(false);
  const isSaveInProgress = useRef(false);
  const styles = createStyles({ themeColors });

  const languageOptions: { value: LocalePreference; label: string }[] = [
    { value: null, label: t.appSettings.language.useDeviceLanguage },
    ...LOCALE_KEYS.map((value) => ({ value, label: locales[value].name })),
  ];

  const handleLanguageChange = async (preference: LocalePreference) => {
    if (isSaveInProgress.current || preference === localePreference) {
      return;
    }

    isSaveInProgress.current = true;
    setIsSaving(true);

    try {
      await setLocalePreference(preference);
    } catch {
      showAlert({
        title: t.appSettings.errors.saveFailed.title,
        message: t.appSettings.errors.saveFailed.message,
        buttons: [{ text: t.common.ok }],
      });
    } finally {
      isSaveInProgress.current = false;
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t.appSettings.title}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Icon name="x" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {t.appSettings.language.title}
          </Text>
          {isSaving && <ActivityIndicator size="small" color={themeColors.primary} />}
        </View>
        <Text style={styles.description}>{t.appSettings.language.description}</Text>

        <View
          style={styles.languageOptions}
          accessibilityRole="radiogroup"
          accessibilityLabel={t.appSettings.language.title}
          accessibilityState={{ busy: isSaving }}
        >
          {languageOptions.map(({ value, label }) => {
            const isSelected = localePreference === value;

            return (
              <TouchableOpacity
                key={value ?? 'system'}
                style={[
                  styles.languageOption,
                  isSelected && styles.languageOptionSelected,
                  isSaving && styles.languageOptionDisabled,
                ]}
                onPress={async () => handleLanguageChange(value)}
                disabled={isSaving}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: isSelected, disabled: isSaving }}
              >
                <Text style={styles.languageLabel}>{label}</Text>
                {isSelected && <Icon name="check" size={20} color={themeColors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 24,
    },
    title: {
      flex: 1,
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: themeColors.secondaryBackground,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    description: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      marginBottom: 20,
    },
    languageOptions: {
      gap: 8,
    },
    languageOption: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: themeColors.border,
      backgroundColor: themeColors.secondaryBackground,
    },
    languageOptionSelected: {
      borderColor: themeColors.primary,
    },
    languageOptionDisabled: {
      opacity: 0.5,
    },
    languageLabel: {
      flex: 1,
      fontSize: 16,
      color: themeColors.foreground,
    },
  });
}
