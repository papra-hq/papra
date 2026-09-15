import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useForm } from '@tanstack/react-form';
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
import * as v from 'valibot';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { useAuthClient } from '@/modules/api/providers/api.provider';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useServerConfig } from '../../config/hooks/use-server-config';
import { getEnabledOAuthProviders } from '../auth.models';
import { AuthNavigation } from '../components/auth-navigation';
import { TwoFactorVerificationForm } from '../components/two-factor-verification';

export function LoginScreen() {
  const t = useAppTranslations();
  const loginSchema = v.object({
    email: v.pipe(v.string(), v.email(t.auth.validation.email)),
    password: v.pipe(v.string(), v.minLength(8, t.auth.validation.password)),
  });

  const router = useRouter();
  const themeColors = useThemeColor();
  const authClient = useAuthClient();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const { serverConfig, isLoading: isConfigLoading } = useServerConfig();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema,
    },

    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const response = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          rememberMe: true,
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (
          response.data &&
          'twoFactorRedirect' in response.data &&
          response.data.twoFactorRedirect
        ) {
          setRequiresTwoFactor(true);
          return;
        }

        router.replace('/(app)/(with-organizations)/(tabs)/list');
      } catch (error) {
        showAlert({
          title: t.auth.login.failed,
          message: error instanceof Error ? error.message : t.common.anErrorOccurred,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleSocialSignIn = async (provider: string) => {
    try {
      const response = await authClient.signIn.social({ provider, callbackURL: '/' });
      if (response.error) {
        throw Object.assign(new Error(response.error.message), response.error);
      }
    } catch (error) {
      showAlert({
        title: t.auth.login.socialFailed,
        message: error instanceof Error ? error.message : t.common.anErrorOccurred,
      });
    }
  };

  const authConfig = serverConfig?.auth;
  const isEmailEnabled = authConfig?.providers?.email?.isEnabled ?? false;

  const oauthProviders = getEnabledOAuthProviders({ serverConfig });

  const styles = createStyles({ themeColors });

  if (isConfigLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AuthNavigation />
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (requiresTwoFactor) {
    return (
      <KeyboardAvoidingView
        style={{ ...styles.container, paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t.auth.twoFactor.title}</Text>
            <Text style={styles.subtitle}>{t.auth.twoFactor.subtitle}</Text>
          </View>

          <TwoFactorVerificationForm
            onSuccess={() => router.replace('/(app)/(with-organizations)/(tabs)/list')}
            onBack={() => setRequiresTwoFactor(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AuthNavigation disabled={isSubmitting} />

        <View style={styles.header}>
          <Text style={styles.title}>{t.auth.login.title}</Text>
          <Text style={styles.subtitle}>{t.auth.login.subtitle}</Text>
        </View>

        {isEmailEnabled && (
          <View style={styles.formContainer}>
            <form.Field name="email">
              {(field) => (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t.common.email}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.auth.emailPlaceholder}
                    placeholderTextColor={themeColors.mutedForeground}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!isSubmitting}
                  />
                </View>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>{t.auth.password}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.auth.login.passwordPlaceholder}
                    placeholderTextColor={themeColors.mutedForeground}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry
                    editable={!isSubmitting}
                  />
                </View>
              )}
            </form.Field>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={async () => form.handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={themeColors.primaryForeground} />
              ) : (
                <Text style={styles.buttonText}>{t.auth.login.submit}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {oauthProviders.length > 0 && (
          <>
            {isEmailEnabled && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t.auth.login.or}</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            <View style={styles.socialButtons}>
              {oauthProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.providerId}
                  style={styles.socialButton}
                  onPress={async () => handleSocialSignIn(provider.providerId)}
                >
                  <Text style={styles.socialButtonText}>
                    {t.auth.login.continueWith({ name: provider.providerName })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {authConfig?.isRegistrationEnabled === true && (
          <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/signup')}>
            <Text style={styles.linkText}>{t.auth.login.signupLink}</Text>
          </TouchableOpacity>
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
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    header: {
      marginBottom: 48,
      marginTop: 16,
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
    formContainer: {
      gap: 16,
    },
    fieldContainer: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
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
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: themeColors.primaryForeground,
      fontSize: 16,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: themeColors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      color: themeColors.mutedForeground,
      fontSize: 14,
    },
    socialButtons: {
      gap: 12,
    },
    socialButton: {
      height: 50,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.secondaryBackground,
    },
    socialButtonText: {
      color: themeColors.foreground,
      fontSize: 16,
      fontWeight: '500',
    },
    linkButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: themeColors.primary,
      fontSize: 14,
    },
    backToServerButton: {
      marginBottom: 16,
      alignSelf: 'flex-start',
    },
    backToServerText: {
      color: themeColors.primary,
      fontSize: 14,
    },
  });
}
