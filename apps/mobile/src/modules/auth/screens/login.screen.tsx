import { useForm } from '@tanstack/react-form';
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
import * as v from 'valibot';
import { useAuthClient } from '@/providers';
import { useServerConfig } from '../../config/hooks/use-server-config';

const loginSchema = v.object({
  email: v.pipe(v.string(), v.email('Please enter a valid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters')),
});

export function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const authClient = useAuthClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: serverConfig, isLoading: isLoadingConfig } = useServerConfig();

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
        const response = await authClient.signIn.email({ email: value.email, password: value.password });

        if (response.error) {
          throw new Error(response.error.message);
        }

        router.replace('/organizations/select');
      } catch (error) {
        Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleSocialSignIn = async (provider: string) => {
    try {
      const response = await authClient.signIn.social({ provider });
      // eslint-disable-next-line no-console
      console.log({ response });
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const authConfig = serverConfig?.config?.auth;
  const isEmailEnabled = authConfig?.providers?.email?.isEnabled ?? false;
  const isGoogleEnabled = authConfig?.providers?.google?.isEnabled ?? false;
  const isGithubEnabled = authConfig?.providers?.github?.isEnabled ?? false;
  const customProviders = authConfig?.providers?.customs ?? [];

  const styles = createStyles(isDark);

  if (isLoadingConfig) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {isEmailEnabled && (
          <View style={styles.formContainer}>
            <form.Field name="email">
              {field => (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={isDark ? '#666' : '#999'}
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
              {field => (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? '#666' : '#999'}
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
              {isSubmitting
                ? (
                    <ActivityIndicator color="#fff" />
                  )
                : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
            </TouchableOpacity>
          </View>
        )}

        {(isGoogleEnabled || isGithubEnabled || customProviders.length > 0) && (
          <>
            {isEmailEnabled && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            <View style={styles.socialButtons}>
              {isGoogleEnabled && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={async () => handleSocialSignIn('google')}
                >
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              )}

              {isGithubEnabled && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={async () => handleSocialSignIn('github')}
                >
                  <Text style={styles.socialButtonText}>Continue with GitHub</Text>
                </TouchableOpacity>
              )}

              {customProviders.map(provider => (
                <TouchableOpacity
                  key={provider.providerId}
                  style={styles.socialButton}
                  onPress={async () => handleSocialSignIn(provider.providerId)}
                >
                  <Text style={styles.socialButtonText}>
                    Continue with
                    {' '}
                    {provider.providerName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {authConfig?.isRegistrationEnabled === true && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account? Sign up
            </Text>
          </TouchableOpacity>
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
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      marginBottom: 32,
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
    formContainer: {
      gap: 16,
    },
    fieldContainer: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
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
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
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
      backgroundColor: isDark ? '#333' : '#ddd',
    },
    dividerText: {
      marginHorizontal: 16,
      color: isDark ? '#666' : '#999',
      fontSize: 14,
    },
    socialButtons: {
      gap: 12,
    },
    socialButton: {
      height: 50,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#111' : '#fff',
    },
    socialButtonText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '500',
    },
    linkButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: '#007AFF',
      fontSize: 14,
    },
  });
}
