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
import { AuthNavigation } from '../components/auth-navigation';

export function SignupScreen() {
  const t = useAppTranslations();
  const signupSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, t.auth.validation.name)),
    email: v.pipe(v.string(), v.email(t.auth.validation.email)),
    password: v.pipe(v.string(), v.minLength(8, t.auth.validation.password)),
  });

  const router = useRouter();
  const themeColors = useThemeColor();
  const authClient = useAuthClient();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { serverConfig, isLoading: isConfigLoading } = useServerConfig();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validators: {
      onChange: signupSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const { name, email, password } = value;

        await authClient.signUp.email({ name, email, password });

        const isEmailVerificationRequired =
          serverConfig?.auth?.isEmailVerificationRequired ?? false;

        if (isEmailVerificationRequired) {
          showAlert({
            title: t.auth.signup.checkEmail,
            message: t.auth.signup.verificationSent,
            buttons: [{ text: t.common.ok, onPress: () => router.replace('/auth/login') }],
          });
        } else {
          router.replace('/(app)/(with-organizations)/(tabs)/list');
        }
      } catch (error) {
        showAlert({
          title: t.auth.signup.failed,
          message: error instanceof Error ? error.message : t.common.anErrorOccurred,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const authConfig = serverConfig?.auth;
  const isRegistrationEnabled = authConfig?.isRegistrationEnabled ?? false;

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

  if (!isRegistrationEnabled) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AuthNavigation />
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{t.auth.signup.disabled}</Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
              <Text style={styles.linkText}>{t.auth.signup.backToLogin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
          <Text style={styles.title}>{t.auth.signup.title}</Text>
          <Text style={styles.subtitle}>{t.auth.signup.subtitle}</Text>
        </View>

        <View style={styles.formContainer}>
          <form.Field name="name">
            {(field) => (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{t.common.name}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t.auth.signup.namePlaceholder}
                  placeholderTextColor={themeColors.mutedForeground}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </View>
            )}
          </form.Field>

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
                  placeholder={t.auth.signup.passwordPlaceholder}
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
              <Text style={styles.buttonText}>{t.auth.signup.submit}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>{t.auth.signup.loginLink}</Text>
        </TouchableOpacity>
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
      padding: 24,
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
    linkButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: themeColors.primary,
      fontSize: 14,
    },
    errorText: {
      fontSize: 16,
      color: themeColors.primary,
      marginBottom: 16,
      textAlign: 'center',
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
