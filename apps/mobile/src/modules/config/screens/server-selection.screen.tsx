import type { ThemeColors } from '@/modules/ui/theme.constants';
import type { CustomHeader } from '../config.models';
import { safelySync } from '@corentinth/chisels';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { validateCustomHeaders, validateServerUrl } from '../config.models';
import { pingServer } from '../config.services';
import { configQueryOptions } from '../config.queries';

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
  const [customHeaderRows, setCustomHeaderRows] = useState<(CustomHeader & { id: number })[]>([]);
  const [areCustomHeadersExpanded, setAreCustomHeadersExpanded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const nextHeaderRowId = useRef(0);

  const isSelfHosted = selectedOption === 'self-hosted';
  const canContinue = !isValidating && (!isSelfHosted || customUrl.trim() !== '');

  const addCustomHeaderRow = () => {
    const id = nextHeaderRowId.current;
    nextHeaderRowId.current += 1;

    setCustomHeaderRows((rows) => [...rows, { id, name: '', value: '' }]);
  };

  const updateCustomHeaderRow = ({ id, ...patch }: { id: number } & Partial<CustomHeader>) => {
    setCustomHeaderRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const deleteCustomHeaderRow = ({ id }: { id: number }) => {
    setCustomHeaderRows((rows) => rows.filter((row) => row.id !== id));
  };

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

    const [customHeaders, headersValidationError] = safelySync(() =>
      validateCustomHeaders({ headers: isSelfHosted ? customHeaderRows : [] }),
    );

    if (headersValidationError) {
      showAlert({
        title: 'Invalid Custom Header',
        message: headersValidationError.message,
      });
      setIsValidating(false);
      return;
    }

    try {
      await pingServer({ url, headers: customHeaders });
    } catch {
      showAlert({
        title: 'Connection Failed',
        message: 'Could not reach the server.',
      });
      setIsValidating(false);
      return;
    }

    try {
      await configLocalStorage.setApiServerConfig({
        apiServerConfig: { baseUrl: url, customHeaders },
      });
      await queryClient.invalidateQueries({ queryKey: configQueryOptions.queryKey });

      router.replace('/auth/login');
    } catch (error) {
      showAlert({
        title: 'Something Went Wrong',
        message:
          error instanceof Error
            ? error.message
            : 'Could not save the server configuration. Please try again.',
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

              <TouchableOpacity
                style={styles.customHeadersToggle}
                onPress={() => setAreCustomHeadersExpanded((isExpanded) => !isExpanded)}
                disabled={isValidating}
                accessibilityRole="button"
                accessibilityState={{ expanded: areCustomHeadersExpanded, disabled: isValidating }}
              >
                <Icon
                  name={areCustomHeadersExpanded ? 'chevron-down' : 'chevron-right'}
                  size={18}
                  color={themeColors.mutedForeground}
                />
                <Text style={styles.customHeadersToggleLabel}>
                  Custom headers
                  {customHeaderRows.length > 0 ? ` (${customHeaderRows.length})` : ''}
                </Text>
              </TouchableOpacity>

              {areCustomHeadersExpanded && (
                <View style={styles.customHeadersList}>
                  {customHeaderRows.map((row) => (
                    <View key={row.id} style={styles.customHeaderRow}>
                      <TextInput
                        style={[styles.input, styles.customHeaderInput]}
                        placeholder="Name"
                        placeholderTextColor={themeColors.mutedForeground}
                        value={row.name}
                        onChangeText={(name) => updateCustomHeaderRow({ id: row.id, name })}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isValidating}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          styles.customHeaderInput,
                          styles.customHeaderValueInput,
                        ]}
                        placeholder="Value"
                        placeholderTextColor={themeColors.mutedForeground}
                        value={row.value}
                        onChangeText={(value) => updateCustomHeaderRow({ id: row.id, value })}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isValidating}
                      />
                      <TouchableOpacity
                        style={styles.customHeaderDeleteButton}
                        onPress={() => deleteCustomHeaderRow({ id: row.id })}
                        disabled={isValidating}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete header ${row.name || 'row'}`}
                      >
                        <Icon name="trash-2" size={18} color={themeColors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addHeaderButton}
                    onPress={addCustomHeaderRow}
                    disabled={isValidating}
                    accessibilityRole="button"
                  >
                    <Icon name="plus" size={16} color={themeColors.foreground} />
                    <Text style={styles.addHeaderButtonLabel}>Add header</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    customHeadersToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    customHeadersToggleLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.mutedForeground,
    },
    customHeadersList: {
      gap: 8,
    },
    customHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    customHeaderInput: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      fontSize: 14,
    },
    customHeaderValueInput: {
      flex: 1.4,
    },
    customHeaderDeleteButton: {
      height: 44,
      width: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 44,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: themeColors.border,
      borderRadius: 8,
    },
    addHeaderButtonLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
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
