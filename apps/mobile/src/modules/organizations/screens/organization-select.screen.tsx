import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useApiClient } from '@/providers';
import { createOrganization, fetchOrganizations } from '../organizations.services';

export function OrganizationSelectScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => fetchOrganizations({ apiClient }),
  });

  const createMutation = useMutation({
    mutationFn: async ({ name}: { name: string }) => createOrganization({ name, apiClient }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreating(false);
      setNewOrgName('');
      router.replace('/(app)/(tabs)/explore');
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create organization');
    },
  });

  const styles = createStyles(isDark);

  if (organizationsQuery.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Organization</Text>
        <Text style={styles.subtitle}>Choose which organization to use</Text>
      </View>

      <FlatList
        data={organizationsQuery.data?.organizations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orgCard}
          >
            <Text style={styles.orgName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No organizations found</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {!isCreating
        ? (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setIsCreating(true)}
            >
              <Text style={styles.createButtonText}>Create New Organization</Text>
            </TouchableOpacity>
          )
        : (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder="Organization name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={newOrgName}
                onChangeText={setNewOrgName}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsCreating(false);
                    setNewOrgName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, createMutation.isPending && styles.buttonDisabled]}
                  onPress={() => createMutation.mutate({ name: newOrgName })}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? (
                        <ActivityIndicator color="#fff" size="small" />
                      )
                    : (
                        <Text style={styles.submitButtonText}>Create</Text>
                      )}
                </TouchableOpacity>
              </View>
            </View>
          )}
    </View>
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
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
    },
    listContent: {
      padding: 16,
      paddingTop: 0,
    },
    orgCard: {
      padding: 20,
      backgroundColor: isDark ? '#111' : '#f9f9f9',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      marginBottom: 12,
    },
    orgName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    orgRole: {
      fontSize: 14,
      color: isDark ? '#999' : '#666',
      textTransform: 'capitalize',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#666' : '#999',
    },
    createButton: {
      margin: 16,
      height: 50,
      backgroundColor: '#007AFF',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    createForm: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e0e0e0',
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
      marginBottom: 12,
    },
    createActions: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    submitButton: {
      flex: 1,
      height: 50,
      backgroundColor: '#007AFF',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
