import type { LocalDocument } from '@/modules/api/api.models';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { queryClient } from '@/modules/api/providers/query.provider';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { convertImagesToPdf } from '../documents-scan.services';
import { documentsLocalStorage } from '../documents.local-storage';
import { uploadDocument } from '../documents.services';
import { syncUnsyncedDocuments } from '../documents.sync.services';
import { RenameDocumentDialog } from './rename-document-dialog';

type ImportDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function ImportDrawer({ visible, onClose }: ImportDrawerProps) {
  const themeColors = useThemeColor();
  const { showAlert } = useAlert();
  const styles = createStyles({ themeColors });
  const apiClient = useApiClient();
  const { currentOrganizationId } = useOrganizations();
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [scannedImageUris, setScannedImageUris] = useState<string[]>([]);
  const [defaultDocumentName, setDefaultDocumentName] = useState('');

  const handleImportFromFiles = async () => {
    onClose();

    try {
      if (currentOrganizationId == null) {
        showAlert({
          title: 'No Organization Selected',
          message: 'Please select an organization before importing documents.',
        });
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const pickerFile = result.assets[0];
      if (!pickerFile) {
        return;
      }

      const file: LocalDocument = {
        uri: pickerFile.uri,
        name: pickerFile.name,
        type: pickerFile.mimeType,
      };

      await uploadDocument({ file, apiClient, organizationId: currentOrganizationId });
      await queryClient.invalidateQueries({ queryKey: ['organizations', currentOrganizationId, 'documents'] });

      showAlert({
        title: 'Upload Successful',
        message: `Successfully uploaded: ${file.name}`,
      });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to pick document',
      });
    }
  };

  const processScannedImages = async (imageUris: string[], fileName: string) => {
    try {
      if (currentOrganizationId == null) {
        showAlert({
          title: 'No Organization Selected',
          message: 'Please select an organization before importing documents.',
        });
        return;
      }

      const timestamp = Date.now();
      const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      const pdfUri = await convertImagesToPdf(imageUris);

      // Copy PDF to permanent location
      const permanentUri = `${FileSystem.documentDirectory}${timestamp}_${finalFileName}`;
      await FileSystem.copyAsync({
        from: pdfUri,
        to: permanentUri,
      });

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // Save as unsynced document
      const unsyncedDoc = {
        id: `local_${timestamp}_${Math.random().toString(36).substring(7)}`,
        name: finalFileName,
        mimeType: 'application/pdf',
        localUri: permanentUri,
        organizationId: currentOrganizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
        originalSize: fileSize,
      };

      await documentsLocalStorage.addUnsyncedDocument(unsyncedDoc);

      try {
        await FileSystem.deleteAsync(pdfUri, { idempotent: true });
      } catch (error) {
        console.error('Error cleaning up temporary PDF:', error);
      }

      await queryClient.invalidateQueries({ queryKey: ['organizations', currentOrganizationId, 'documents'] });
      // Trigger background sync
      void syncUnsyncedDocuments({ organizationId: currentOrganizationId, apiClient });
    } catch (error) {
      console.error('Error processing scanned image:', error);
      showAlert({
        title: 'Scan Error',
        message: error instanceof Error ? error.message : 'Failed to process scanned document',
      });
    }
  };

  const handleRenameConfirm = async (name: string) => {
    setRenameModalVisible(false);
    await processScannedImages(scannedImageUris, name);
    setScannedImageUris([]);
    setDefaultDocumentName('');
  };

  const handleRenameCancel = () => {
    setRenameModalVisible(false);
    setScannedImageUris([]);
    setDefaultDocumentName('');
  };

  const handleScanDocument = async () => {
    onClose();

    try {
      const { scannedImages, status } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
      });

      if (status === 'cancel') {
        return;
      }

      if (scannedImages && scannedImages.length > 0) {
        const timestamp = Date.now();
        setDefaultDocumentName(`scanned_document_${timestamp}`);
        setScannedImageUris(scannedImages);
        setRenameModalVisible(true);
      } else {
        showAlert({
          title: 'Scan Error',
          message: 'No images were scanned',
        });
      }
    } catch (error) {
      console.error('Error in handleScan:', error);
      showAlert({
        title: 'Scan Error',
        message: error instanceof Error ? error.message : 'Failed to scan document',
      });
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.drawer}>
            <View style={styles.header}>
              <Text style={styles.title}>Import Document</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleImportFromFiles}
              >
                <View style={styles.optionIconContainer}>
                  <Icon name="file-plus" size={24} style={styles.optionIcon} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Import from Files</Text>
                  <Text style={styles.optionDescription}>
                    Choose a document from your device
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} style={styles.chevronIcon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleScanDocument}
              >
                <View style={styles.optionIconContainer}>
                  <Icon name="camera" size={24} style={styles.optionIcon} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Scan Document</Text>
                  <Text style={styles.optionDescription}>
                    Use camera to scan a document
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} style={styles.chevronIcon} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <RenameDocumentDialog
        visible={renameModalVisible}
        defaultName={defaultDocumentName}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    drawer: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    optionsContainer: {
      paddingVertical: 8,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    optionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionIcon: {
      fontSize: 24,
      color: themeColors.primary,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    chevronIcon: {
      fontSize: 18,
      color: themeColors.mutedForeground,
    },
    cancelButton: {
      margin: 20,
      marginTop: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
  });
}
