import type { ShareIntentFile } from 'expo-share-intent';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { formatBytes } from '@corentinth/chisels';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApiClient } from '@/modules/api/providers/api.provider';
import { queryClient } from '@/modules/api/providers/query.provider';
import { joinFileName, splitFileName } from '@/modules/lib/path/path.models';
import { OrganizationPickerDrawer } from '@/modules/organizations/components/organization-picker-drawer';
import { useOrganizations } from '@/modules/organizations/organizations.provider';
import { Icon } from '@/modules/ui/components/icon';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';
import { uploadDocument } from '../documents.services';

type UploadStatus =
  | { state: 'idle' }
  | { state: 'uploading'; current: number; total: number }
  | { state: 'success'; count: number };

export function DocumentShareScreen() {
  const router = useRouter();
  const themeColors = useThemeColor();
  const insets = useSafeAreaInsets();
  const apiClient = useApiClient();
  const { showAlert } = useAlert();
  const { shareIntent, resetShareIntent } = useShareIntentContext();
  const { organizations, currentOrganizationId } = useOrganizations();

  const [files, setFiles] = useState<ShareIntentFile[]>(shareIntent.files ?? []);
  const [baseName, setBaseName] = useState(() => splitFileName(files[0]?.fileName ?? '').baseName);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
    currentOrganizationId,
  );
  const [isOrgPickerVisible, setIsOrgPickerVisible] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ state: 'idle' });

  const styles = createStyles({ themeColors });

  // A new share can arrive while the screen is already mounted (the user
  // shares another file without closing the app), refresh the form with it
  useEffect(() => {
    if (shareIntent.files && shareIntent.files.length > 0) {
      setFiles(shareIntent.files);
      setBaseName(splitFileName(shareIntent.files[0]?.fileName ?? '').baseName);
      setStatus({ state: 'idle' });
    }
  }, [shareIntent.files]);

  // The current organization may not be loaded yet when the screen mounts
  useEffect(() => {
    if (selectedOrganizationId == null && currentOrganizationId != null) {
      setSelectedOrganizationId(currentOrganizationId);
    }
  }, [selectedOrganizationId, currentOrganizationId]);

  const isSingleFile = files.length === 1;
  const singleFileExtension = isSingleFile
    ? splitFileName(files[0]?.fileName ?? '').extension
    : undefined;

  const selectedOrganization = organizations.find((org) => org.id === selectedOrganizationId);

  const leaveScreen = () => {
    resetShareIntent();

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(with-organizations)/(tabs)/list');
    }
  };

  const getUploadName = (file: ShareIntentFile) => {
    if (!isSingleFile) {
      return file.fileName;
    }

    return joinFileName({ baseName: baseName.trim(), extension: singleFileExtension });
  };

  const handleSave = async () => {
    if (selectedOrganizationId == null) {
      showAlert({
        title: 'No Organization Selected',
        message: 'Please select an organization to save the document to.',
      });
      return;
    }

    const totalCount = files.length;

    for (const [index, file] of files.entries()) {
      setStatus({ state: 'uploading', current: index + 1, total: totalCount });

      try {
        await uploadDocument({
          file: {
            uri: file.path,
            name: getUploadName(file),
            type: file.mimeType,
          },
          apiClient,
          organizationId: selectedOrganizationId,
        });
      } catch (error) {
        // Keep the files that were not uploaded yet so the user can retry
        // without duplicating the ones that already went through
        setFiles(files.slice(index));
        setStatus({ state: 'idle' });
        showAlert({
          title: 'Upload Failed',
          message: `Failed to upload ${file.fileName}: ${error instanceof Error ? error.message : 'unknown error'}`,
        });
        return;
      }
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', selectedOrganizationId, 'documents'],
    });

    setStatus({ state: 'success', count: totalCount });
  };

  const isSaveDisabled =
    files.length === 0 ||
    selectedOrganizationId == null ||
    (isSingleFile && baseName.trim().length === 0);

  if (status.state === 'success') {
    const firstFile = files[0];
    const destinationName = selectedOrganization?.name ?? 'your organization';
    const successMessage =
      status.count === 1 && firstFile
        ? `${getUploadName(firstFile)} has been saved to ${destinationName}.`
        : `${status.count} documents have been saved to ${destinationName}.`;

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Icon name="check" size={40} color={themeColors.primary} />
          </View>
          <Text style={styles.successTitle}>Saved to Papra</Text>
          <Text style={styles.successMessage}>{successMessage}</Text>
          <TouchableOpacity
            style={[styles.primaryButton, styles.successButton]}
            onPress={leaveScreen}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Save to Papra</Text>
        <TouchableOpacity
          onPress={leaveScreen}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={status.state === 'uploading'}
        >
          <Icon name="x" size={24} color={themeColors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {files.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No shared file to save.</Text>
          </View>
        ) : (
          <>
            {files.map((file) => (
              <View key={file.path} style={styles.fileCard}>
                <View style={styles.fileIconContainer}>
                  <Icon name="file-text" size={24} color={themeColors.primary} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  {file.size != null && (
                    <Text style={styles.fileMeta}>{formatBytes({ bytes: file.size })}</Text>
                  )}
                </View>
              </View>
            ))}

            {isSingleFile && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={baseName}
                    onChangeText={setBaseName}
                    placeholder="Document name"
                    placeholderTextColor={themeColors.mutedForeground}
                    editable={status.state !== 'uploading'}
                  />
                  {singleFileExtension && (
                    <Text style={styles.nameExtension}>.{singleFileExtension}</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Organization</Text>
              <TouchableOpacity
                style={styles.orgSelector}
                onPress={() => setIsOrgPickerVisible(true)}
                disabled={status.state === 'uploading'}
              >
                <Text style={styles.orgSelectorText} numberOfLines={1}>
                  {selectedOrganization?.name ?? 'Select an organization'}
                </Text>
                <Icon name="chevron-down" size={20} color={themeColors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.primaryButton, isSaveDisabled && styles.primaryButtonDisabled]}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaveDisabled || status.state === 'uploading'}
        >
          {status.state === 'uploading' ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={themeColors.primaryForeground} />
              <Text style={styles.primaryButtonText}>
                {status.total === 1
                  ? 'Uploading…'
                  : `Uploading ${status.current} of ${status.total}…`}
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              {files.length > 1 ? `Save ${files.length} documents` : 'Save to Papra'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <OrganizationPickerDrawer
        visible={isOrgPickerVisible}
        onClose={() => setIsOrgPickerVisible(false)}
        selectedOrganizationId={selectedOrganizationId}
        onSelectOrganization={setSelectedOrganizationId}
      />
    </KeyboardAvoidingView>
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.foreground,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: themeColors.mutedForeground,
    },
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      padding: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    fileIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: themeColors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      marginBottom: 4,
    },
    fileMeta: {
      fontSize: 14,
      color: themeColors.mutedForeground,
    },
    fieldContainer: {
      marginTop: 20,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.mutedForeground,
      marginBottom: 8,
    },
    nameInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
    },
    nameInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: themeColors.foreground,
    },
    nameExtension: {
      fontSize: 16,
      color: themeColors.mutedForeground,
      marginLeft: 4,
    },
    orgSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    orgSelectorText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.foreground,
      marginRight: 8,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    primaryButton: {
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: themeColors.primary,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primaryForeground,
    },
    uploadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    successContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    successIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: themeColors.foreground,
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 15,
      color: themeColors.mutedForeground,
      textAlign: 'center',
      marginBottom: 32,
    },
    successButton: {
      alignSelf: 'stretch',
    },
  });
}
