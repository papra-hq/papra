import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { IconName } from '@/modules/ui/components/icon';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { formatBytes } from '@corentinth/chisels';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { useApiClient, useAuthClient } from '@/modules/api/providers/api.provider';
import { RenameDocumentDialog } from '@/modules/documents/components/rename-document-dialog';
import {
  deleteDocument,
  fetchDocumentFile,
  renameDocument,
} from '@/modules/documents/documents.services';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentActionSheetProps = {
  visible: boolean;
  document: CoerceDates<Document> | undefined;
  onClose: () => void;
  excludedActions?: ActionsKey[];
  onDeleted?: () => void;
};

export type ActionsKey = 'view' | 'rename' | 'share' | 'delete';

export function DocumentActionSheet({
  visible,
  document,
  onClose,
  excludedActions = [],
  onDeleted,
}: DocumentActionSheetProps) {
  const t = useAppTranslations();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const authClient = useAuthClient();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [isRenameDialogVisible, setIsRenameDialogVisible] = useState(false);

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

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showAlert({
        title: t.documents.sharingFailed,
        message: t.documents.sharingUnavailable,
      });
      return;
    }

    try {
      const fileUri = await fetchDocumentFile({
        document,
        organizationId: document.organizationId,
        authClient,
      });

      await Sharing.shareAsync(fileUri);
    } catch {
      showAlert({
        title: t.common.error,
        message: t.documents.downloadFailed,
      });
    }
  };

  const handleRename = () => {
    // Keep the sheet mounted: onClose() would unmount this component (and the
    // dialog with it) when the parent conditionally renders the sheet.
    setIsRenameDialogVisible(true);
  };

  const handleRenameCancel = () => {
    setIsRenameDialogVisible(false);
    onClose();
  };

  const handleRenameConfirm = async (name: string) => {
    setIsRenameDialogVisible(false);
    onClose();

    if (name === document.name) {
      return;
    }

    try {
      await renameDocument({
        organizationId: document.organizationId,
        documentId: document.id,
        name,
        apiClient,
      });

      await queryClient.invalidateQueries({
        queryKey: ['organizations', document.organizationId, 'documents'],
      });
    } catch {
      showAlert({
        title: t.common.error,
        message: t.documents.renameFailed,
      });
    }
  };

  const handleDelete = () => {
    onClose();

    showAlert({
      title: t.documents.deleteTitle,
      message: t.documents.deleteConfirmation({ name: document.name }),
      buttons: [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument({
                organizationId: document.organizationId,
                documentId: document.id,
                apiClient,
              });

              await queryClient.invalidateQueries({
                queryKey: ['organizations', document.organizationId, 'documents'],
              });

              onDeleted?.();
            } catch {
              showAlert({
                title: t.common.error,
                message: t.documents.deleteFailed,
              });
            }
          },
        },
      ],
    });
  };

  // Extract MIME type subtype, fallback to full MIME type if subtype is missing
  const mimeParts = document.mimeType.split('/');
  const mimeSubtype = mimeParts[1];
  const displayMimeType =
    mimeSubtype != null && mimeSubtype !== '' ? mimeSubtype.toUpperCase() : document.mimeType;

  const actions: {
    key: ActionsKey;
    label: string;
    icon: IconName;
    onPress: () => void;
    destructive?: boolean;
  }[] = [
    {
      key: 'view',
      label: t.documents.view,
      icon: 'eye',
      onPress: handleView,
    },
    {
      key: 'rename',
      label: t.documents.rename,
      icon: 'edit-2',
      onPress: handleRename,
    },
    {
      key: 'share',
      label: t.common.share,
      icon: 'share',
      onPress: handleDownloadAndShare,
    },
    {
      key: 'delete',
      label: t.common.delete,
      icon: 'trash-2',
      onPress: handleDelete,
      destructive: true,
    },
  ];
  const filteredActions = actions.filter((action) => !excludedActions.includes(action.key));

  return (
    <>
      <RenameDocumentDialog
        visible={isRenameDialogVisible}
        defaultName={document.name}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />

      <Modal
        visible={visible && !isRenameDialogVisible}
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
                  {filteredActions.map((action) => (
                    <TouchableOpacity
                      key={action.key}
                      style={styles.actionRow}
                      onPress={action.onPress}
                      activeOpacity={0.6}
                    >
                      <View style={styles.actionIconContainer}>
                        <Icon
                          name={action.icon}
                          size={20}
                          color={
                            action.destructive === true
                              ? themeColors.destructive
                              : themeColors.foreground
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.actionText,
                          action.destructive === true && { color: themeColors.destructive },
                        ]}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
