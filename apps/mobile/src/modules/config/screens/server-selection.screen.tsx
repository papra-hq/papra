import type { ThemeColors } from '@/modules/ui/theme.constants';
import { safelySync } from '@corentinth/chisels';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { queryClient } from '@/modules/api/providers/query.provider';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { MANAGED_SERVER_URL } from '../config.constants';
import { configLocalStorage } from '../config.local-storage';
import { validateServerUrl } from '../config.models';
import { pingServer } from '../config.services';

function getDefaultCustomServerUrl() {
  if (!__DEV__) {
    return '';
  }

  // eslint-disable-next-line node/prefer-global/process
  return process.env.EXPO_PUBLIC_API_URL ?? '';
}

export function ServerSelectionScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const { showAlert } = useAlert();
  const styles = createStyles({ themeColors });

  const [selectedOption, setSelectedOption] = useState<'managed' | 'self-hosted'>('managed');
  const [customUrl, setCustomUrl] = useState(getDefaultCustomServerUrl());
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateCustomUrl = async ({ url: rawUrl }: { url: string }) => {
    setIsValidating(true);

    const [url, urlValidationError] = safelySync(() => validateServerUrl({ url: rawUrl }));

    if (urlValidationError) {
      showAlert({
        title: 'Invalid URL',
        message: 'Please enter a valid server URL. Make sure to include the protocol (http:// or https://).',
      });
      setIsValidating(false);
      return;
    }

    try {
      await pingServer({ url });
      await configLocalStorage.setApiServerBaseUrl({ apiServerBaseUrl: url });
      await queryClient.invalidateQueries({ queryKey: ['api-server-url'] });

      router.replace('/auth/login');
    } catch {
      showAlert({
        title: 'Connection Failed',
        message: 'Could not reach the server.',
      });
    } finally {
      setIsValidating(false);
    }
  };

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
                  <ActivityIndicator color={themeColors.primaryForeground} />
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
              placeholderTextColor={themeColors.mutedForeground}
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
                    <ActivityIndicator color={themeColors.primaryForeground} />
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

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
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
      color: themeColors.foreground,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.mutedForeground,
    },
    options: {
      gap: 16,
      marginBottom: 24,
    },
    optionCard: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: themeColors.border,
      backgroundColor: themeColors.secondaryBackground,
    },
    optionCardSelected: {
      borderColor: themeColors.primary,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      margin: 0,
    },
    optionDescription: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    customUrlContainer: {
      gap: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 4,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: themeColors.foreground,
      backgroundColor: themeColors.secondaryBackground,
    },
    button: {
      height: 50,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: themeColors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
