import type { ReactNode } from 'react';
import type { ThemeColors } from '../theme.constants';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { useThemeColor } from '../providers/use-theme-color';

export function BottomDrawer({
  visible,
  onClose,
  dismissible = true,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) {
  const t = useAppTranslations();
  const themeColors = useThemeColor();
  const insets = useSafeAreaInsets();
  const styles = createStyles({ themeColors });

  const handleClose = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          accessibilityState={{ disabled: !dismissible }}
          disabled={!dismissible}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleBar} />
          {children}
        </View>
      </KeyboardAvoidingView>
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
      maxHeight: '85%',
      backgroundColor: themeColors.secondaryBackground,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
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
  });
}
