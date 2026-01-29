import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useMutation } from '@tanstack/react-query';
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
import { useApiClient } from '@/modules/api/providers/api.provider';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useOrganizations } from '../organizations.provider';
import { createOrganization } from '../organizations.services';

export function OrganizationCreateScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const apiClient = useApiClient();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { setCurrentOrganizationId, refetch } = useOrganizations();

  const [organizationName, setOrganizationName] = useState('');

  const createMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => createOrganization({ name, apiClient }),
    onSuccess: async (data) => {
      await refetch();
      await setCurrentOrganizationId(data.organization.id);
      router.replace('/(app)/(with-organizations)/(tabs)/list');
    },
    onError: (error) => {
      showAlert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create organization',
      });
    },
  });

  const handleCreate = () => {
    if (organizationName.trim().length === 0) {
      showAlert({
        title: 'Invalid Name',
        message: 'Please enter a valid organization name',
      });
      return;
    }

    createMutation.mutate({ name: organizationName.trim() });
  };

  const styles = createStyles({ themeColors });

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
          <Text style={styles.title}>Create organization</Text>
          <Text style={styles.subtitle}>
            Your documents will be grouped by organization. You can create multiple organizations to separate your documents, for example, for personal and work documents.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Organization Name</Text>
            <TextInput
              style={styles.input}
              placeholder="My Organization"
              placeholderTextColor={themeColors.mutedForeground}
              value={organizationName}
              onChangeText={setOrganizationName}
              autoFocus
              autoCapitalize="words"
              editable={!createMutation.isPending}
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, createMutation.isPending && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending
              ? (
                  <ActivityIndicator color={themeColors.primaryForeground} />
                )
              : (
                  <Text style={styles.buttonText}>Create Organization</Text>
                )}
          </TouchableOpacity>
        </View>
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
    },
    header: {
      marginBottom: 48,
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
  });
}
