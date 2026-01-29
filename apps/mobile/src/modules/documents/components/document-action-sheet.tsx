import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { IconName } from '@/modules/ui/components/icon';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { formatBytes } from '@corentinth/chisels';
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
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentActionSheetProps = {
  visible: boolean;
  document: CoerceDates<Document> | undefined;
  onClose: () => void;
  excludedActions?: ActionsKey[];
};

export type ActionsKey = 'view' | 'share';

export function DocumentActionSheet({
  visible,
  document,
  onClose,
  excludedActions = [],
}: DocumentActionSheetProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const authClient = useAuthClient();

  if (document === undefined) {
    return null;
  }

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
    onClose();

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
  const displayMimeType = mimeSubtype != null && mimeSubtype !== '' ? mimeSubtype.toUpperCase() : document.mimeType;

  const actions: { key: ActionsKey; label: string; icon: IconName; onPress: () => void }[] = [
    {
      key: 'view',
      label: 'View document',
      icon: 'eye',
      onPress: handleView,
    },
    {
      key: 'share',
      label: 'Share',
      icon: 'share',
      onPress: handleDownloadAndShare,
    },
  ];
  const filteredActions = actions.filter(action => !excludedActions.includes(action.key));

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
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <View style={styles.fileIconContainer}>
                  <Icon name="file-text" size={24} color={themeColors.primary} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {document.name}
                  </Text>
                  <Text style={styles.documentMeta}>
                    {displayMimeType}
                    {' · '}
                    {formatBytes({ bytes: document.originalSize })}
                    {' · '}
                    {formatDate(document.createdAt.toISOString())}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                {filteredActions.map(action => (
                  <TouchableOpacity
                    key={action.key}
                    style={styles.actionRow}
                    onPress={action.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={styles.actionIconContainer}>
                      <Icon name={action.icon} size={20} color={themeColors.foreground} />
                    </View>
                    <Text style={styles.actionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 34,
    },
    handleBar: {
      width: 36,
      height: 4,
      backgroundColor: themeColors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    fileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: themeColors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 4,
    },
    documentMeta: {
      fontSize: 13,
      color: themeColors.mutedForeground,
    },
    actions: {
      paddingTop: 8,
      paddingBottom: 8,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 32,
      marginVertical: 4,
    },
    actionIconContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    actionText: {
      flex: 1,
      fontSize: 16,
      color: themeColors.foreground,
    },
  });
}
