import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthClient } from '@/modules/api/providers/api.provider';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

export default function SettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const authClient = useAuthClient();
  const session = authClient.useSession();
  const { showAlert } = useAlert();

  const handleSignOut = () => {
    showAlert({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {session.data?.user && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{session.data.user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{session.data.user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Verified</Text>
              <Text style={styles.infoValue}>
                {session.data.user.emailVerified ? 'Yes' : 'No'}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
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
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    infoValue: {
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
    dangerButton: {
      backgroundColor: themeColors.destructiveBackground,
    },
    dangerText: {
      color: themeColors.destructive,
    },
  });
}
