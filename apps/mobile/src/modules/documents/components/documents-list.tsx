import type { ComponentProps } from 'react';
import type { Document } from '../documents.types';
import type { CoerceDates } from '@/modules/api/api.models';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { formatBytes } from '@corentinth/chisels';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DocumentActionSheet } from '@/modules/documents/components/document-action-sheet';
import { Tag } from '@/modules/tags/components/tag';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

const maxVisibleTags = 3;

type DocumentsListProps = {
  documents: CoerceDates<Document>[];
  emptyState: {
    title: string;
    subtitle?: string;
  };
  refreshControl?: ComponentProps<typeof FlatList>['refreshControl'];
  keyboardShouldPersistTaps?: ComponentProps<typeof FlatList>['keyboardShouldPersistTaps'];
};

export function DocumentsList({
  documents,
  emptyState,
  refreshControl,
  keyboardShouldPersistTaps,
}: DocumentsListProps) {
  const themeColors = useThemeColor();
  const [onDocumentActionSheet, setOnDocumentActionSheet] = useState<
    CoerceDates<Document> | undefined
  >(undefined);

  const styles = createStyles({ themeColors });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      {onDocumentActionSheet && (
        <DocumentActionSheet
          visible={true}
          document={onDocumentActionSheet}
          onClose={() => setOnDocumentActionSheet(undefined)}
        />
      )}
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/(app)/document/details',
                params: {
                  documentId: item.id,
                  organizationId: item.organizationId,
                },
              });
            }}
          >
            <View style={styles.documentCard}>
              <View
                style={{
                  backgroundColor: themeColors.muted,
                  padding: 10,
                  borderRadius: 6,
                  marginRight: 12,
                }}
              >
                <Icon name="file-text" size={24} color={themeColors.primary} />
              </View>
              <View style={styles.documentContent}>
                <Text style={styles.documentTitle} numberOfLines={1} ellipsizeMode="tail">
                  {item.name}
                </Text>
                <View style={styles.documentMeta}>
                  <Text style={styles.metaText}>{formatBytes({ bytes: item.originalSize })}</Text>
                  <Text style={styles.metaSplitter}>-</Text>
                  <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                  {item.localUri !== undefined && (
                    <View
                      style={[
                        styles.unsyncedBadge,
                        { backgroundColor: `${themeColors.primary}20` },
                      ]}
                    >
                      <Icon name="upload" size={12} color={themeColors.primary} />
                    </View>
                  )}
                </View>
                {item.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {item.tags.slice(0, maxVisibleTags).map((tag) => (
                      <Tag key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                    {item.tags.length > maxVisibleTags && (
                      <Tag name={`+${item.tags.length - maxVisibleTags}`} />
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setOnDocumentActionSheet(item);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="more-vertical" size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyState.title}</Text>
            {emptyState.subtitle !== undefined && (
              <Text style={styles.emptySubtext}>{emptyState.subtitle}</Text>
            )}
          </View>
        }
        contentContainerStyle={documents.length === 0 ? styles.emptyList : undefined}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      />
    </>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
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
    documentContent: {
      flex: 1,
      marginRight: 8,
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    moreButton: {
      padding: 8,
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
      marginTop: 6,
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
