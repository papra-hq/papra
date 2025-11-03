import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { MANAGED_SERVER_URL } from '@/types/config.types';
import { configLocalStorage } from '../config.local-storage';
import { pingServer } from '../config.services';

export function ServerSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedOption, setSelectedOption] = useState<'managed' | 'self-hosted' | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateCustomUrl = async ({ url}: { url: string }) => {
    setIsValidating(true);
    try {
      await pingServer({ url });
      await configLocalStorage.setApiServerBaseUrl({ apiServerBaseUrl: url });

      router.replace('/auth/login');
    } catch {
      Alert.alert('Connection Failed', 'Could not reach the server.');
    } finally {
      setIsValidating(false);
    }
  };

  const styles = createStyles(isDark);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Papra</Text>
          <Text style={styles.subtitle}>Choose your server</Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'managed' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption('managed')}
            disabled={isValidating}
          >
            <Text style={styles.optionTitle}>Managed Cloud</Text>
            <Text style={styles.optionDescription}>
              Use the official Papra cloud service
            </Text>
            <Text style={styles.optionUrl}>{MANAGED_SERVER_URL}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'self-hosted' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption('self-hosted')}
            disabled={isValidating}
          >
            <Text style={styles.optionTitle}>Self-Hosted</Text>
            <Text style={styles.optionDescription}>
              Connect to your own Papra server
            </Text>
          </TouchableOpacity>
        </View>

        {selectedOption === 'managed' && (
          <TouchableOpacity
            style={[styles.button, isValidating && styles.buttonDisabled]}
            onPress={async () => handleValidateCustomUrl({ url: MANAGED_SERVER_URL })}
            disabled={isValidating}
          >
            {isValidating
              ? (
                  <ActivityIndicator color="#fff" />
                )
              : (
                  <Text style={styles.buttonText}>Continue with Managed</Text>
                )}
          </TouchableOpacity>
        )}

        {selectedOption === 'self-hosted' && (
          <View style={styles.customUrlContainer}>
            <Text style={styles.inputLabel}>Server URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-server.com"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={customUrl}
              onChangeText={setCustomUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isValidating}
            />
            <TouchableOpacity
              style={[styles.button, isValidating && styles.buttonDisabled]}
              onPress={async () => handleValidateCustomUrl({ url: customUrl })}
              disabled={isValidating}
            >
              {isValidating
                ? (
                    <ActivityIndicator color="#fff" />
                  )
                : (
                    <Text style={styles.buttonText}>Connect</Text>
                  )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#999' : '#666',
    },
    options: {
      gap: 16,
      marginBottom: 24,
    },
    optionCard: {
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? '#333' : '#e0e0e0',
      backgroundColor: isDark ? '#111' : '#f9f9f9',
    },
    optionCardSelected: {
      borderColor: '#007AFF',
      backgroundColor: isDark ? '#001a33' : '#e6f2ff',
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    optionDescription: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
      marginBottom: 8,
    },
    optionUrl: {
      fontSize: 12,
      color: '#007AFF',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    customUrlContainer: {
      gap: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      backgroundColor: isDark ? '#111' : '#fff',
    },
    button: {
      height: 50,
      backgroundColor: '#007AFF',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
