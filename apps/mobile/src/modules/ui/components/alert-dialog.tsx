import type { ReactNode } from 'react';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertDialogProps = {
  visible: boolean;
  title: string;
  message?: string | ReactNode;
  buttons: AlertButton[];
  onDismiss?: () => void;
};

export function AlertDialog({ visible, title, message, buttons, onDismiss }: AlertDialogProps) {
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message !== undefined && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '85%',
      maxWidth: 400,
    },
    content: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 12,
    },
    message: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      marginBottom: 24,
      lineHeight: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: themeColors.primary,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
    cancelButton: {
      backgroundColor: themeColors.secondaryBackground,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cancelButtonText: {
      color: themeColors.foreground,
    },
    destructiveButton: {
      backgroundColor: themeColors.destructiveBackground,
    },
    destructiveButtonText: {
      color: themeColors.destructive,
    },
  });
}
