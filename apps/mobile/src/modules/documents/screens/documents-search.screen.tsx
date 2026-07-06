import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { DocumentsList } from '@/modules/documents/components/documents-list';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { fetchOrganizationDocuments } from '../documents.services';

const SEARCH_DEBOUNCE_MS = 300;
const pagination = { pageIndex: 0, pageSize: 20 };

export function DocumentsSearchScreen() {
  const themeColors = useThemeColor();
  const apiClient = useApiClient();
  const { currentOrganizationId } = useOrganizations();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearchQuery(searchQuery.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const searchResultsQuery = useQuery({
    queryKey: [
      'organizations',
      currentOrganizationId,
      'documents',
      'search',
      debouncedSearchQuery,
      pagination,
    ],
    queryFn: async () => {
      if (currentOrganizationId == null) {
        return { documents: [], documentsCount: 0 };
      }

      return fetchOrganizationDocuments({
        organizationId: currentOrganizationId,
        searchQuery: debouncedSearchQuery,
        ...pagination,
        apiClient,
      });
    },
    enabled:
      currentOrganizationId !== null && currentOrganizationId !== '' && debouncedSearchQuery !== '',
  });

  const handleCancel = () => {
    Keyboard.dismiss();
    setSearchQuery('');

    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/(app)/(with-organizations)/(tabs)/list');
    }
  };

  const styles = createStyles({ themeColors });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color={themeColors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents"
            placeholderTextColor={themeColors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <Icon name="x" size={18} color={themeColors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10 }}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {debouncedSearchQuery === '' ? (
        <View style={styles.centerContent}>
          <Icon name="search" size={40} color={themeColors.mutedForeground} />
          <Text style={styles.hintText}>Search your documents</Text>
          <Text style={styles.hintSubtext}>Find documents by name or content</Text>
        </View>
      ) : searchResultsQuery.isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <DocumentsList
          documents={searchResultsQuery.data?.documents ?? []}
          emptyState={{
            title: 'No documents found',
            subtitle: `No results for "${debouncedSearchQuery}"`,
          }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
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
      gap: 8,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      paddingTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      backgroundColor: themeColors.secondaryBackground,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: themeColors.foreground,
    },
    cancelButtonText: {
      fontSize: 16,
      color: themeColors.primary,
    },
    hintText: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginTop: 8,
    },
    hintSubtext: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
  });
}
