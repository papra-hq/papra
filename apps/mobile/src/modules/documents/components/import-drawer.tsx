import type { ThemeColors } from '@/modules/ui/theme.constants';
import * as DocumentPicker from 'expo-document-picker';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { queryClient } from '@/modules/api/providers/query.provider';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { uploadDocument } from '../documents.services';
import { LocalDocument } from '@/modules/api/api.models';

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

  // const handleScanDocument = () => {
  //   onClose();
  //   showAlert({
  //     title: 'Coming Soon',
  //     message: 'Camera document scanning will be available soon!',
  //   });
  // };

  return (
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

            {/* <TouchableOpacity
              style={styles.optionItem}
              onPress={handleScanDocument}
            >
              <View style={styles.optionIconContainer}>
                <Icon name="camera" size={24} style={styles.optionIcon} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Scan Document</Text>
                <Text style={styles.optionDescription}>
                  Use camera to scan (Coming soon)
                </Text>
              </View>
              <Icon name="chevron-right" size={18} style={styles.chevronIcon} />
            </TouchableOpacity> */}
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
