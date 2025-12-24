import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type RenameDocumentDialogProps = {
  visible: boolean;
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

export function RenameDocumentDialog({
  visible,
  defaultName,
  onConfirm,
  onCancel,
}: RenameDocumentDialogProps) {
  const themeColors = useThemeColor();
  const { showAlert } = useAlert();
  const styles = createStyles({ themeColors });
  const [documentName, setDocumentName] = useState('');

  // Reset name when modal becomes visible
  useEffect(() => {
    if (visible) {
      setDocumentName(defaultName);
    }
  }, [visible, defaultName]);

  const handleConfirm = () => {
    if (documentName.trim() === '') {
      showAlert({
        title: 'Invalid Name',
        message: 'Please enter a document name',
      });
      return;
    }

    onConfirm(documentName.trim());
    setDocumentName('');
  };

  const handleCancel = () => {
    setDocumentName('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Document Name</Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={documentName}
                  onChangeText={setDocumentName}
                  placeholder="Enter document name"
                  placeholderTextColor={themeColors.mutedForeground}
                  autoFocus
                  onSubmitEditing={handleConfirm}
                />
              </View>

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Save</Text>
                </TouchableOpacity>
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
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    content: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      padding: 20,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: themeColors.foreground,
      backgroundColor: themeColors.secondaryBackground,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.secondaryBackground,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    confirmButton: {
      backgroundColor: themeColors.primary,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
  });
}
