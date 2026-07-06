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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/modules/api/providers/query.provider';
import { Icon } from '@/modules/ui/components/icon';
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
  const insets = useSafeAreaInsets();
  const styles = createStyles({ themeColors });

  const [selectedOption, setSelectedOption] = useState<'managed' | 'self-hosted'>('managed');
  const [customUrl, setCustomUrl] = useState(getDefaultCustomServerUrl());
  const [isValidating, setIsValidating] = useState(false);

  const isSelfHosted = selectedOption === 'self-hosted';
  const canContinue = !isValidating && (!isSelfHosted || customUrl.trim() !== '');

  const handleContinue = async () => {
    const rawUrl = isSelfHosted ? customUrl : MANAGED_SERVER_URL;

    setIsValidating(true);

    const [url, urlValidationError] = safelySync(() => validateServerUrl({ url: rawUrl }));

    if (urlValidationError) {
      showAlert({
        title: 'Invalid URL',
        message:
          'Please enter a valid server URL. Make sure to include the protocol (http:// or https://).',
      });
      setIsValidating(false);
      return;
    }

    try {
      await pingServer({ url });
    } catch {
      showAlert({
        title: 'Connection Failed',
        message: 'Could not reach the server.',
      });
      setIsValidating(false);
      return;
    }

    try {
      await configLocalStorage.setApiServerBaseUrl({ apiServerBaseUrl: url });
      await queryClient.invalidateQueries({ queryKey: ['api-server-url'] });

      router.replace('/auth/login');
    } catch {
      showAlert({
        title: 'Something Went Wrong',
        message: 'Could not save the server configuration. Please try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Icon name="file-text" size={28} color={themeColors.primary} />
          <Text style={styles.brandName}>Papra</Text>
        </View>

        <Text style={styles.title}>Organize, secure &{'\n'}archive your documents.</Text>
        <Text style={styles.subtitle}>First, choose where your documents live.</Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.optionCard, selectedOption === 'managed' && styles.optionCardSelected]}
            onPress={() => setSelectedOption('managed')}
            disabled={isValidating}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedOption === 'managed', disabled: isValidating }}
          >
            <Icon name="cloud" size={22} color={themeColors.foreground} style={styles.optionIcon} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Managed Cloud</Text>
              <Text style={styles.optionDescription}>Use the official Papra cloud service</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, isSelfHosted && styles.optionCardSelected]}
            onPress={() => setSelectedOption('self-hosted')}
            disabled={isValidating}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelfHosted, disabled: isValidating }}
          >
            <Icon
              name="server"
              size={22}
              color={themeColors.foreground}
              style={styles.optionIcon}
            />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Self-Hosted</Text>
              <Text style={styles.optionDescription}>Connect to your own Papra server</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.customUrlZone}>
          {isSelfHosted && (
            <>
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
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          {isValidating ? (
            <ActivityIndicator color={themeColors.primaryForeground} />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Icon name="arrow-right" size={18} color={themeColors.primaryForeground} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
      padding: 24,
      paddingTop: 32,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 48,
    },
    brandName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
      color: themeColors.foreground,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: themeColors.mutedForeground,
    },
    options: {
      gap: 16,
      marginBottom: 32,
      marginTop: 48,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
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
    optionIcon: {
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    optionDescription: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    customUrlZone: {
      minHeight: 88,
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.mutedForeground,
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
    footer: {
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    button: {
      height: 50,
      flexDirection: 'row',
      gap: 8,
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
