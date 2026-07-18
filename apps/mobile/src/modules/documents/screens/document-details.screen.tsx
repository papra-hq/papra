import type { DocumentCustomProperty } from '@/modules/documents/documents.types';
import type { IconName } from '@/modules/ui/components/icon';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { formatBytes } from '@corentinth/chisels';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { useApiClient, useAuthClient } from '@/modules/api/providers/api.provider';
import { DocumentActionSheet } from '@/modules/documents/components/document-action-sheet';
import { fetchDocument, fetchDocumentFile } from '@/modules/documents/documents.services';
import { Tag } from '@/modules/tags/components/tag';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

const customPropertyTypeIcons: Record<string, IconName> = {
  'text': 'type',
  'number': 'hash',
  'boolean': 'check-square',
  'date': 'calendar',
  'select': 'list',
  'multi-select': 'list',
  'document-relation': 'file',
  'user-relation': 'user',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatCustomPropertyValue({ type, value }: DocumentCustomProperty): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string' || typeof item === 'number')
      .map(String)
      .join(', ');
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (type === 'date') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date);
      }
    }

    return value;
  }

  return JSON.stringify(value);
}

// Extract MIME type subtype, fallback to full MIME type if subtype is missing
function getDisplayMimeType(mimeType: string): string {
  const mimeSubtype = mimeType.split('/')[1];
  return mimeSubtype != null && mimeSubtype !== '' ? mimeSubtype.toUpperCase() : mimeType;
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
  styles,
  themeColors,
}: {
  icon: IconName;
  label: string;
  value: string;
  isLast?: boolean;
  styles: ReturnType<typeof createStyles>;
  themeColors: ThemeColors;
}) {
  return (
    <View style={[styles.infoRow, isLast === true && styles.infoRowLast]}>
      <View style={styles.infoRowLabel}>
        <Icon name={icon} size={16} color={themeColors.mutedForeground} />
        <Text style={styles.infoRowLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoRowValue} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

export function DocumentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string; organizationId: string }>();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const apiClient = useApiClient();
  const authClient = useAuthClient();
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'download' | 'share' | undefined>(undefined);

  const { documentId, organizationId } = params;

  const documentQuery = useQuery({
    queryKey: ['organizations', organizationId, 'documents', documentId],
    queryFn: async () => fetchDocument({ organizationId, documentId, apiClient }),
    enabled: organizationId != null && documentId != null,
  });

  if (organizationId == null || documentId == null) {
    showAlert({
      title: 'Error',
      message: 'Organization ID and Document ID are required',
    });
    return null;
  }

  const document = documentQuery.data?.document;

  const getLocalFileUri = async () => {
    if (document == null) {
      throw new Error('Document not loaded');
    }

    return fetchDocumentFile({ document, organizationId, authClient });
  };

  const handleOpen = () => {
    router.push({
      pathname: '/(app)/document/view',
      params: { documentId, organizationId },
    });
  };

  const handleDownload = async () => {
    if (document == null || pendingAction != null) {
      return;
    }

    try {
      setPendingAction('download');
      const fileUri = await getLocalFileUri();

      if (Platform.OS === 'android') {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          document.name,
          document.mimeType,
        );
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        showAlert({ title: 'Downloaded', message: `${document.name} has been saved` });
      } else {
        // On iOS saving a file goes through the share sheet ("Save to Files")
        await Sharing.shareAsync(fileUri);
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to download document file' });
    } finally {
      setPendingAction(undefined);
    }
  };

  const handleShare = async () => {
    if (document == null || pendingAction != null) {
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showAlert({
        title: 'Sharing Failed',
        message: 'Sharing is not available on this device. Please share the document manually.',
      });
      return;
    }

    try {
      setPendingAction('share');
      const fileUri = await getLocalFileUri();
      await Sharing.shareAsync(fileUri);
    } catch {
      showAlert({ title: 'Error', message: 'Failed to download document file' });
    } finally {
      setPendingAction(undefined);
    }
  };

  const renderContent = () => {
    if (documentQuery.isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.centeredText}>Loading document...</Text>
        </View>
      );
    }

    if (documentQuery.error != null || document == null) {
      return (
        <View style={styles.centeredContainer}>
          <Icon name="alert-circle" size={64} color={themeColors.mutedForeground} />
          <Text style={styles.centeredTitle}>Failed to load document</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void documentQuery.refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const customProperties = [...(document.customProperties ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const hasNotes = document.notes != null && document.notes.trim() !== '';

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Icon name="file-text" size={28} color={themeColors.primary} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroName} numberOfLines={2}>
              {document.name}
            </Text>
            <Text style={styles.heroMeta}>
              {formatBytes({ bytes: document.originalSize })}
              {' · '}
              {getDisplayMimeType(document.mimeType)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.openButton} onPress={handleOpen} activeOpacity={0.7}>
            <Icon name="eye" size={18} color={themeColors.primaryForeground} />
            <Text style={styles.openButtonText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => void handleDownload()}
            activeOpacity={0.7}
          >
            {pendingAction === 'download' ? (
              <ActivityIndicator size="small" color={themeColors.foreground} />
            ) : (
              <Icon name="download" size={18} color={themeColors.foreground} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => void handleShare()}
            activeOpacity={0.7}
          >
            {pendingAction === 'share' ? (
              <ActivityIndicator size="small" color={themeColors.foreground} />
            ) : (
              <Icon name="share" size={18} color={themeColors.foreground} />
            )}
          </TouchableOpacity>
        </View>

        {document.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {document.tags.map((tag) => (
                <Tag key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </View>
          </View>
        )}

        {hasNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText} selectable>
                {document.notes}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.card}>
            <InfoRow
              icon="file-text"
              label="Name"
              value={document.name}
              styles={styles}
              themeColors={themeColors}
            />
            <InfoRow
              icon="hard-drive"
              label="Size"
              value={formatBytes({ bytes: document.originalSize })}
              styles={styles}
              themeColors={themeColors}
            />
            <InfoRow
              icon="file"
              label="Type"
              value={getDisplayMimeType(document.mimeType)}
              styles={styles}
              themeColors={themeColors}
            />
            <InfoRow
              icon="calendar"
              label="Date"
              value={formatDate(document.createdAt)}
              styles={styles}
              themeColors={themeColors}
            />
            <InfoRow
              icon="hash"
              label="ID"
              value={document.id}
              isLast
              styles={styles}
              themeColors={themeColors}
            />
          </View>
        </View>

        {customProperties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Properties</Text>
            <View style={styles.card}>
              {customProperties.map((property, index) => (
                <InfoRow
                  key={property.key}
                  icon={customPropertyTypeIcons[property.type] ?? 'tag'}
                  label={property.name}
                  value={formatCustomPropertyValue(property)}
                  isLast={index === customProperties.length - 1}
                  styles={styles}
                  themeColors={themeColors}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Icon name="arrow-left" size={22} color={themeColors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document?.name ?? 'Document'}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setIsActionSheetVisible(true)}>
          <Icon name="more-vertical" size={22} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      <DocumentActionSheet
        visible={isActionSheetVisible}
        document={document}
        onClose={() => setIsActionSheetVisible(false)}
        excludedActions={['view']}
        onDeleted={() => router.back()}
      />

      {renderContent()}
    </SafeAreaView>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.foreground,
      marginHorizontal: 16,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    heroIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: themeColors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    heroContent: {
      flex: 1,
    },
    heroName: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 4,
    },
    heroMeta: {
      fontSize: 13,
      color: themeColors.mutedForeground,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    openButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: themeColors.primary,
      borderRadius: 10,
      paddingVertical: 12,
    },
    openButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
    iconButton: {
      width: 46,
      borderRadius: 10,
      backgroundColor: themeColors.secondaryBackground,
      borderWidth: 1,
      borderColor: themeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: themeColors.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    card: {
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
      paddingHorizontal: 16,
    },
    notesText: {
      fontSize: 14,
      lineHeight: 20,
      color: themeColors.foreground,
      paddingVertical: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoRowLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    infoRowLabelText: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    infoRowValue: {
      flex: 1,
      fontSize: 14,
      color: themeColors.foreground,
      textAlign: 'right',
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    centeredTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginTop: 16,
    },
    centeredText: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      marginTop: 8,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      marginTop: 16,
    },
    retryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primary,
    },
  });
}
