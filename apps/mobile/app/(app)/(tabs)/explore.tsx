import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAuthClient } from '@/providers';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const authClient = useAuthClient();
  const session = authClient.useSession();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
    );
  };

  const handleSwitchOrganization = () => {
    router.push('/organizations/select');
  };

  const handleChangeServer = async () => {
    Alert.alert(
      'Change Server',
      'This will sign you out and clear all local data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            await authClient.signOut();
            router.replace('/config/server-selection');
          },
        },
      ],
    );
  };

  const styles = createStyles(isDark);

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.sectionTitle}>Organization</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSwitchOrganization}
        >
          <Text style={styles.actionButtonText}>Switch Organization</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChangeServer}
        >
          <Text style={styles.actionButtonText}>Change Server</Text>
        </TouchableOpacity>
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
    </ScrollView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#999' : '#666',
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
      backgroundColor: isDark ? '#111' : '#f9f9f9',
      borderRadius: 8,
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#fff' : '#000',
    },
    actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: isDark ? '#111' : '#f9f9f9',
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#fff' : '#000',
      textAlign: 'center',
    },
    dangerButton: {
      backgroundColor: isDark ? '#2a1a1a' : '#ffe0e0',
    },
    dangerText: {
      color: isDark ? '#ff6b6b' : '#d32f2f',
    },
  });
}
