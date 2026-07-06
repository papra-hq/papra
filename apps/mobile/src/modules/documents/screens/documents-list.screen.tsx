import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { DocumentsList } from '@/modules/documents/components/documents-list';
import { OrganizationPickerButton } from '@/modules/organizations/components/organization-picker-button';
import { OrganizationPickerDrawer } from '@/modules/organizations/components/organization-picker-drawer';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { fetchOrganizationDocuments } from '../documents.services';
import { syncUnsyncedDocuments } from '../documents.sync.services';

export function DocumentsListScreen() {
  const themeColors = useThemeColor();
  const apiClient = useApiClient();
  const { currentOrganizationId, isLoading: isLoadingOrganizations } = useOrganizations();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const pagination = { pageIndex: 0, pageSize: 20 };

  const documentsQuery = useQuery({
    queryKey: ['organizations', currentOrganizationId, 'documents', pagination],
    queryFn: async () => {
      if (currentOrganizationId == null) {
        return { documents: [], documentsCount: 0 };
      }

      return fetchOrganizationDocuments({
        organizationId: currentOrganizationId,
        ...pagination,
        apiClient,
      });
    },
    enabled: currentOrganizationId !== null && currentOrganizationId !== '',
  });

  const styles = createStyles({ themeColors });

  const onRefresh = async () => {
    await documentsQuery.refetch();
    if (currentOrganizationId != null) {
      void syncUnsyncedDocuments({ organizationId: currentOrganizationId, apiClient });
    }
  };

  if (isLoadingOrganizations) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <OrganizationPickerButton variant="plain" onPress={() => setIsDrawerVisible(true)} />
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => router.navigate('/(app)/(with-organizations)/(tabs)/settings')}
            accessibilityRole="button"
            accessibilityLabel="User settings"
          >
            <Icon name="user" size={20} color={themeColors.foreground} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Documents</Text>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.navigate('/(app)/(with-organizations)/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Search documents"
        >
          <Icon name="search" size={18} color={themeColors.mutedForeground} />
          <Text style={styles.searchButtonText}>Search documents</Text>
        </TouchableOpacity>
      </View>

      {documentsQuery.isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <DocumentsList
          documents={documentsQuery.data?.documents ?? []}
          emptyState={{
            title: 'No documents yet',
            subtitle: 'Upload your first document to get started',
          }}
          refreshControl={
            <RefreshControl refreshing={documentsQuery.isRefetching} onRefresh={onRefresh} />
          }
        />
      )}

      <OrganizationPickerDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
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
    },
    header: {
      padding: 16,
      paddingTop: 12,
      gap: 12,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    userButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.secondaryBackground,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    searchButton: {
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
    searchButtonText: {
      fontSize: 16,
      color: themeColors.mutedForeground,
    },
  });
}
