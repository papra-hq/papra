import type { Document } from '../documents.types';
import type { CoerceDates } from '@/modules/api/api.models';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { DocumentActionSheet } from '@/modules/documents-actions/components/document-action-sheet';
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
  const [onDocumentActionSheet, setOnDocumentActionSheet] = useState<CoerceDates<Document> | undefined>(undefined);
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
      {onDocumentActionSheet && (
        <DocumentActionSheet
          visible={true}
          document={onDocumentActionSheet}
          onClose={() => setOnDocumentActionSheet(undefined)}
        />
      )}
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <OrganizationPickerButton onPress={() => setIsDrawerVisible(true)} />
      </View>

      {documentsQuery.isLoading
        ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          )
        : (
            <FlatList
              data={documentsQuery.data?.documents ?? []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setOnDocumentActionSheet(item)}>
                  <View style={styles.documentCard}>
                    <View style={{ backgroundColor: themeColors.muted, padding: 10, borderRadius: 6, marginRight: 12 }}>
                      <Icon name="file-text" size={24} color={themeColors.primary} />
                    </View>
                    <View>
                      <Text style={styles.documentTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.documentMeta}>
                        <Text style={styles.metaText}>{formatFileSize(item.originalSize)}</Text>
                        <Text style={styles.metaSplitter}>-</Text>
                        <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                        {item.localUri !== undefined && (
                          <View style={[styles.unsyncedBadge, { backgroundColor: `${themeColors.primary}20` }]}>
                            <Icon name="upload" size={12} color={themeColors.primary} />
                          </View>
                        )}
                        {item.tags.length > 0 && (
                          <View style={styles.tagsContainer}>
                            {item.tags.map(tag => (
                              <View
                                key={tag.id}
                                style={[
                                  styles.tag,
                                  { backgroundColor: `${tag.color}10` },
                                ]}
                              >
                                <Text style={[styles.tagText, { color: tag.color }]}>
                                  {tag.name}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={(
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No documents yet</Text>
                  <Text style={styles.emptySubtext}>
                    Upload your first document to get started
                  </Text>
                </View>
              )}
              contentContainerStyle={documentsQuery.data?.documents.length === 0 ? styles.emptyList : undefined}
              refreshControl={(
                <RefreshControl
                  refreshing={documentsQuery.isRefetching}
                  onRefresh={onRefresh}
                />
              )}
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
      paddingTop: 20,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    emptyList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    documentCard: {
      padding: 16,
      borderBottomWidth: 1,
      borderColor: themeColors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      marginRight: 12,
    },
    documentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    metaText: {
      fontSize: 13,
      color: themeColors.mutedForeground,
    },
    metaSplitter: {
      fontSize: 13,
      color: themeColors.mutedForeground,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 12,
    },
    unsyncedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
  });
}
