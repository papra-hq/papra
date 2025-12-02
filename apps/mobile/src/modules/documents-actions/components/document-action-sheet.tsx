import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuthClient } from '@/modules/api/providers/api.provider';
import { configLocalStorage } from '@/modules/config/config.local-storage';
import { fetchDocumentFile } from '@/modules/documents/documents.services';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentActionSheetProps = {
  visible: boolean;
  document: CoerceDates<Document> | undefined;
  onClose: () => void;
};

export function DocumentActionSheet({
  visible,
  document,
  onClose,
}: DocumentActionSheetProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const authClient = useAuthClient();

  if (document === undefined) {
    return null;
  }

  // Check if document can be viewed in DocumentViewerScreen
  // Supported types: images (image/*) and PDFs (application/pdf)
  const isViewable
    = document.mimeType.startsWith('image/')
      || document.mimeType.startsWith('application/pdf');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleView = async () => {
    onClose();
    router.push({
      pathname: '/(app)/document/view',
      params: {
        documentId: document.id,
        organizationId: document.organizationId,
      },
    });
  };

  const handleDownloadAndShare = async () => {
    const baseUrl = await configLocalStorage.getApiServerBaseUrl();

    if (baseUrl == null) {
      showAlert({
        title: 'Error',
        message: 'Base URL not found',
      });
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
      const fileUri = await fetchDocumentFile({
        document,
        organizationId: document.organizationId,
        baseUrl,
        authClient,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error downloading document file:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to download document file',
      });
    }
  };

  // Extract MIME type subtype, fallback to full MIME type if subtype is missing
  const mimeParts = document.mimeType.split('/');
  const mimeSubtype = mimeParts[1];
  const displayMimeType = mimeSubtype != null && mimeSubtype !== '' ? mimeSubtype : document.mimeType;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Document info */}
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={2}>
                  {document.name}
                </Text>

                {/* Document details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="file"
                      size={14}
                      color={themeColors.mutedForeground}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText}>{formatFileSize(document.originalSize)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={14}
                      color={themeColors.mutedForeground}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText}>{formatDate(document.createdAt.toISOString())}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={14}
                      color={themeColors.mutedForeground}
                      style={styles.detailIcon}
                    />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {displayMimeType}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                {isViewable && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      onClose();
                      await handleView();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIcon, styles.viewIcon]}>
                      <MaterialCommunityIcons
                        name="eye"
                        size={20}
                        color={themeColors.primary}
                      />
                    </View>
                    <Text style={styles.actionText}>View</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={async () => {
                    onClose();
                    await handleDownloadAndShare();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, styles.downloadIcon]}>
                    <MaterialCommunityIcons
                      name="download"
                      size={20}
                      color={themeColors.primary}
                    />
                  </View>
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Cancel button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: themeColors.secondaryBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 34, // Safe area for bottom
      paddingTop: 16,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: themeColors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    documentInfo: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      textAlign: 'center',
      marginBottom: 12,
    },
    detailsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailIcon: {
      marginRight: 2,
    },
    detailText: {
      fontSize: 12,
      color: themeColors.mutedForeground,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 16,
    },
    actionButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    viewIcon: {
      backgroundColor: `${themeColors.primary}15`,
    },
    downloadIcon: {
      backgroundColor: `${themeColors.primary}15`,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.foreground,
    },
    cancelButton: {
      marginHorizontal: 24,
      marginTop: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
  });
}
