import type { ScanOutputFormat } from '../documents-scan.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTranslations } from '@/modules/i18n/hooks/use-app-translations';
import { OrganizationPickerButton } from '@/modules/organizations/components/organization-picker-button';
import { OrganizationPickerDrawer } from '@/modules/organizations/components/organization-picker-drawer';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { useScanProcessor } from '../../hooks/use-scan-processor.hook';
import { DocumentNameInput } from '../components/document-name-input';
import { FormatSelector } from '../components/format-selector';
import { ImagePreviewCarousel } from '../components/image-preview-carousel';
import { scanDocuments } from '../documents-scan.services';

function generateDefaultBaseName({ now = new Date() }: { now?: Date } = {}): string {
  return `scan-${now.getTime()}`;
}

export default function ScanReviewScreen() {
  const t = useAppTranslations();
  const router = useRouter();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const { currentOrganizationId } = useOrganizations();
  const { processAndUpload, isProcessing } = useScanProcessor();

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [format, setFormat] = useState<ScanOutputFormat>('pdf-merged');
  const [documentName, setDocumentName] = useState(() => generateDefaultBaseName());
  const [isOrgPickerVisible, setIsOrgPickerVisible] = useState(false);

  const pageCount = imageUris.length;

  useEffect(() => {
    const performScan = async () => {
      try {
        const { scannedImageUris } = await scanDocuments();

        if (!scannedImageUris || scannedImageUris.length === 0) {
          // User cancelled or no images scanned
          router.back();
          return;
        }

        setImageUris(scannedImageUris);
      } catch (error) {
        showAlert({
          title: t.documents.scan.errorTitle,
          message: error instanceof Error ? error.message : t.documents.scan.failed,
        });
        router.back();
      } finally {
        setIsScanning(false);
      }
    };

    void performScan();
  }, [router, showAlert, t.documents.scan.errorTitle, t.documents.scan.failed]);

  const handleClose = () => {
    router.back();
  };

  const handleConfirm = async () => {
    const baseName = documentName.trim();
    const organizationId = currentOrganizationId;

    if (organizationId == null) {
      showAlert({
        title: t.documents.import.noOrganization,
        message: t.documents.scan.selectBeforeUpload,
      });
      return;
    }

    if (!baseName) {
      showAlert({
        title: t.documents.scan.nameRequiredTitle,
        message: t.documents.scan.nameRequired,
      });
      return;
    }

    const result = await processAndUpload({
      imageUris,
      format,
      baseName,
      organizationId,
    });

    if (result.success) {
      showAlert({
        title: t.documents.import.uploadSuccessful,
        message: t.documents.scan.uploaded({ count: result.documentCount }),
      });
      router.back();
    } else {
      showAlert({
        title: t.documents.import.uploadFailed,
        message: result.error ?? t.documents.scan.uploadFailed,
        buttons: [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.common.retry, onPress: () => void handleConfirm() },
        ],
      });
    }
  };

  if (isScanning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>{t.documents.scan.opening}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (imageUris.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{t.documents.scan.empty}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
            <Text style={styles.actionButtonText}>{t.common.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <Icon name="x" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.documents.scan.title}</Text>
        <Text style={styles.pageCount}>{t.documents.scan.pageCount({ count: pageCount })}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ImagePreviewCarousel imageUris={imageUris} />

          <FormatSelector
            selectedFormat={format}
            onFormatChange={setFormat}
            isSinglePage={pageCount === 1}
          />

          <DocumentNameInput value={documentName} onChangeText={setDocumentName} format={format} />

          <View style={styles.orgSection}>
            <Text style={styles.sectionLabel}>{t.documents.scan.uploadTo}</Text>
            <OrganizationPickerButton onPress={() => setIsOrgPickerVisible(true)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose} disabled={isProcessing}>
          <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
          onPress={() => void handleConfirm()}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={themeColors.primaryForeground} />
          ) : (
            <>
              <Icon name="upload" size={18} color={themeColors.primaryForeground} />
              <Text style={styles.confirmButtonText}>{t.common.confirm}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={styles.loadingText}>{t.documents.scan.processing}</Text>
          </View>
        </View>
      )}

      <OrganizationPickerDrawer
        visible={isOrgPickerVisible}
        onClose={() => setIsOrgPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function createStyles({ themeColors }: { themeColors: ThemeColors }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
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
      marginLeft: 16,
    },
    pageCount: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      backgroundColor: themeColors.secondaryBackground,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
    },
    orgSection: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
    },
    confirmButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    confirmButtonDisabled: {
      opacity: 0.6,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingCard: {
      backgroundColor: themeColors.background,
      padding: 32,
      borderRadius: 16,
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: themeColors.foreground,
      fontWeight: '500',
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    errorText: {
      fontSize: 16,
      color: themeColors.mutedForeground,
      marginBottom: 16,
    },
    actionButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: themeColors.primary,
      borderRadius: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
  });
}
