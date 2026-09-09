import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthClient } from '@/modules/api/providers/api.provider';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export default function SettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const authClient = useAuthClient();
  const session = authClient.useSession();
  const { showAlert } = useAlert();
  const t = useAppTranslations();

  const handleSignOut = () => {
    showAlert({
      title: t.settings.signOut.title,
      message: t.settings.signOut.confirmation,
      buttons: [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.signOut.title,
          style: 'destructive',
          onPress: async () => {
            await authClient.signOut();
            router.replace('/auth/login');
          },
        },
      ],
    });
  };

  const styles = createStyles({ themeColors });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.settings.title}</Text>
      </View>

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          {session.data?.user && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.settings.name}</Text>
                <Text style={styles.infoValue}>{session.data.user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.settings.email}</Text>
                <Text style={styles.infoValue}>{session.data.user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.settings.emailVerified}</Text>
                <Text style={styles.infoValue}>
                  {session.data.user.emailVerified ? t.settings.yes : t.settings.no}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.app}</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.appSettingsButton]}
            onPress={() => router.push('/app-settings')}
            accessibilityRole="button"
          >
            <Icon name="settings" size={20} color={themeColors.foreground} />
            <Text style={styles.appSettingsLabel}>{t.appSettings.title}</Text>
            <Icon name="chevron-right" size={20} color={themeColors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleSignOut}
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              {t.settings.signOut.title}
            </Text>
          </TouchableOpacity>
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
      padding: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.mutedForeground,
      textTransform: 'uppercase',
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    infoRow: {
      gap: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      marginBottom: 8,
    },
    infoLabel: {
      flexShrink: 1,
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    infoValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.foreground,
    },
    actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.foreground,
      textAlign: 'center',
    },
    appSettingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 48,
    },
    appSettingsLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: themeColors.foreground,
    },
    dangerButton: {
      backgroundColor: themeColors.destructiveBackground,
    },
    dangerText: {
      color: themeColors.destructive,
    },
  });
}
