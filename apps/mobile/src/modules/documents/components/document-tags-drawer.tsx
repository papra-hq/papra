import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import {
  documentTagMutationKey,
  documentTagMutationOptions,
  organizationTagsQueryOptions,
} from '@/modules/tags/tags.queries';
import { BottomDrawer } from '@/modules/ui/components/bottom-drawer';
import { Icon } from '@/modules/ui/components/icon';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { documentQueryOptions } from '../documents.queries';

type DocumentTagsDrawerContentProps = {
  organizationId: string;
  documentId: string;
  onClose: () => void;
};

export function DocumentTagsDrawer({
  visible,
  organizationId,
  documentId,
  onClose,
}: DocumentTagsDrawerContentProps & { visible: boolean }) {
  const pendingUpdates = useIsMutating({
    mutationKey: documentTagMutationKey({ organizationId, documentId }),
  });

  return (
    <BottomDrawer visible={visible} onClose={onClose} dismissible={pendingUpdates === 0}>
      {visible && (
        <DocumentTagsDrawerContent
          key={`${organizationId}:${documentId}`}
          organizationId={organizationId}
          documentId={documentId}
          onClose={onClose}
        />
      )}
    </BottomDrawer>
  );
}

// Also embedded in the action drawer so switching to tag management does not
// dismiss and present competing native modals on iOS.
export function DocumentTagsDrawerContent({
  organizationId,
  documentId,
  onClose,
}: DocumentTagsDrawerContentProps) {
  const t = useAppTranslations();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const documentQuery = useQuery({
    ...documentQueryOptions({ organizationId, documentId, apiClient }),
    staleTime: 0,
  });
  const tagsQuery = useQuery(organizationTagsQueryOptions({ organizationId, apiClient }));
  const mutationOptions = documentTagMutationOptions({
    organizationId,
    documentId,
    apiClient,
    queryClient,
  });
  const updateTagMutation = useMutation(mutationOptions);
  const selectedIds = new Set(documentQuery.data?.document.tags.map(({ id }) => id));
  const tags = tagsQuery.data?.tags ?? [];
  const searchText = search.trim().toLocaleLowerCase();
  const filteredTags = tags
    .filter(({ name }) => name.toLocaleLowerCase().includes(searchText))
    .sort((a, b) => a.name.localeCompare(b.name));
  const isLoading = documentQuery.isPending || tagsQuery.isPending;
  const hasLoadError = documentQuery.isError || tagsQuery.isError;

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t.documents.manageTags}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={updateTagMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          accessibilityState={{ disabled: updateTagMutation.isPending }}
        >
          <Icon name="x" size={22} color={themeColors.mutedForeground} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={themeColors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.documents.tagPicker.searchPlaceholder}
          accessibilityLabel={t.documents.tagPicker.searchPlaceholder}
          placeholderTextColor={themeColors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {updateTagMutation.isError && (
        <Text style={styles.error} accessibilityRole="alert">
          {t.documents.tagPicker.updateFailed}
        </Text>
      )}

      {hasLoadError ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{t.documents.tagPicker.loadFailed}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              void documentQuery.refetch();
              void tagsQuery.refetch();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator
            color={themeColors.primary}
            accessibilityLabel={t.documents.tagPicker.loading}
          />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredTags}
          keyExtractor={({ id }) => id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          extraData={{ selectedIds, isPending: updateTagMutation.isPending }}
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);
            const isUpdating =
              updateTagMutation.isPending && updateTagMutation.variables.tag.id === item.id;

            return (
              <TouchableOpacity
                style={[styles.tagRow, selected && styles.selectedRow]}
                accessibilityRole="checkbox"
                accessibilityLabel={item.name}
                accessibilityState={{ checked: selected, disabled: updateTagMutation.isPending }}
                disabled={updateTagMutation.isPending}
                onPress={() => {
                  // Check the cache synchronously to guard rapid taps before React rerenders.
                  if (queryClient.isMutating({ mutationKey: mutationOptions.mutationKey }) > 0) {
                    return;
                  }
                  updateTagMutation.mutate({ tag: item, selected: !selected });
                }}
              >
                <View style={[styles.tagDot, { backgroundColor: item.color }]} />
                <Text style={styles.tagName} numberOfLines={2}>
                  {item.name}
                </Text>
                {isUpdating && (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.primary}
                    accessibilityLabel={t.documents.tagPicker.updating}
                  />
                )}
                <Icon
                  name={selected ? 'check-square' : 'square'}
                  size={22}
                  color={selected ? themeColors.primary : themeColors.mutedForeground}
                />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {tags.length === 0 ? t.documents.tagPicker.empty : t.documents.tagPicker.noResults}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    content: {
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
      gap: 12,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.background,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: themeColors.foreground,
    },
    list: {
      flexGrow: 0,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      minHeight: 52,
    },
    selectedRow: {
      backgroundColor: themeColors.muted,
    },
    tagDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    tagName: {
      flex: 1,
      fontSize: 16,
      color: themeColors.foreground,
    },
    statusContainer: {
      padding: 24,
      alignItems: 'center',
      gap: 8,
    },
    statusText: {
      color: themeColors.mutedForeground,
      fontSize: 14,
      textAlign: 'center',
    },
    retryButton: {
      padding: 12,
    },
    retryText: {
      color: themeColors.primary,
      fontWeight: '600',
      fontSize: 16,
    },
    error: {
      color: themeColors.destructive,
      marginHorizontal: 20,
      marginBottom: 12,
      fontSize: 14,
    },
  });
}
