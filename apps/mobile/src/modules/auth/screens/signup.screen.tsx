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

const signupSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
  email: v.pipe(v.string(), v.email('Please enter a valid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters')),
});

export function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const authClient = useAuthClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: serverConfig, isLoading: isLoadingConfig } = useServerConfig();

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

        const isEmailVerificationRequired = serverConfig?.config?.auth?.isEmailVerificationRequired ?? false;

        if (isEmailVerificationRequired) {
          Alert.alert(
            'Check your email',
            'We sent you a verification link. Please check your email to verify your account.',
            [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
          );
        } else {
          router.replace('/organizations/select');
        }
      } catch (error) {
        Alert.alert('Signup Failed', error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const authConfig = serverConfig?.config?.auth;
  const isRegistrationEnabled = authConfig?.isRegistrationEnabled ?? false;

  const styles = createStyles(isDark);

  if (isLoadingConfig) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isRegistrationEnabled) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Registration is currently disabled</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Go back to login</Text>
        </TouchableOpacity>
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.formContainer}>
          <form.Field name="name">
            {field => (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
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
                  placeholder="At least 8 characters"
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
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
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
      padding: 24,
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
    linkButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: '#007AFF',
      fontSize: 14,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#ff6b6b' : '#d32f2f',
      marginBottom: 16,
      textAlign: 'center',
    },
  });
}
