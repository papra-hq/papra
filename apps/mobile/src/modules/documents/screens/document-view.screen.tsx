import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient, useAuthClient } from '@/modules/api/providers/api.provider';
import { configLocalStorage } from '@/modules/config/config.local-storage';
import { DocumentActionSheet } from '@/modules/documents/components/document-action-sheet';
import { fetchDocument, fetchDocumentFile } from '@/modules/documents/documents.services';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentFile = {
  uri: string;
  doc: CoerceDates<Document>;
  textContent?: string;
};

const textMimeTypes = new Set([
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-yaml',
  'application/yaml',
  'application/xhtml+xml',
]);

function isTextBasedFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') || textMimeTypes.has(mimeType);
}

function DocumentViewer({ file, styles, themeColors, onError }: {
  file: DocumentFile;
  styles: ReturnType<typeof createStyles>;
  themeColors: ThemeColors;
  onError: (message: string) => void;
}) {
  const { mimeType } = file.doc;

  if (mimeType.startsWith('image/')) {
    return <Image source={{ uri: file.uri }} style={styles.documentViewer} />;
  }

  if (mimeType === 'application/pdf') {
    return (
      <Pdf
        source={{ uri: file.uri, cache: true }}
        style={styles.documentViewer}
        onError={(error) => {
          console.error('PDF error:', error);
          onError('Failed to load PDF');
        }}
        enablePaging
        horizontal={false}
        enableAnnotationRendering
        fitPolicy={0}
        spacing={10}
      />
    );
  }

  if (file.textContent != null) {
    return (
      <ScrollView style={styles.textViewer} contentContainerStyle={styles.textViewerContent}>
        <Text style={styles.textContent} selectable>
          {file.textContent}
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.centeredContainer}>
      <MaterialCommunityIcons name="file-question-outline" size={64} color={themeColors.mutedForeground} />
      <Text style={styles.centeredTitle}>Preview not available</Text>
      <Text style={styles.centeredText}>This file type cannot be previewed in the app</Text>
    </View>
  );
}

function LoadingState({ styles, themeColors }: { styles: ReturnType<typeof createStyles>; themeColors: ThemeColors }) {
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={themeColors.primary} />
      <Text style={styles.centeredText}>Loading document...</Text>
    </View>
  );
}

function ErrorState({ styles, themeColors, onRetry, onGoBack }: {
  styles: ReturnType<typeof createStyles>;
  themeColors: ThemeColors;
  onRetry: () => void;
  onGoBack: () => void;
}) {
  return (
    <View style={styles.centeredContainer}>
      <MaterialCommunityIcons name="file-alert-outline" size={64} color={themeColors.mutedForeground} />
      <Text style={styles.centeredTitle}>Failed to load document</Text>
      <TouchableOpacity style={styles.actionButton} onPress={onRetry}>
        <Text style={styles.actionButtonText}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onGoBack}>
        <Text style={styles.actionButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string; organizationId: string }>();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const apiClient = useApiClient();
  const authClient = useAuthClient();
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const { documentId, organizationId } = params;

  if (organizationId == null || documentId == null) {
    showAlert({
      title: 'Error',
      message: 'Organization ID and Document ID are required',
    });
    return null;
  }

  const documentQuery = useQuery({
    queryKey: ['organizations', organizationId, 'documents', documentId],
    queryFn: async () => fetchDocument({ organizationId, documentId, apiClient }),
  });

  const documentFileQuery = useQuery({
    queryKey: ['organizations', organizationId, 'documents', documentId, 'file'],
    queryFn: async () => {
      if (documentQuery.data == null) {
        throw new Error('Document not loaded');
      }

      const baseUrl = await configLocalStorage.getApiServerBaseUrl();
      if (baseUrl == null) {
        throw new Error('Base URL not found');
      }

      const fileUri = await fetchDocumentFile({
        document: documentQuery.data.document,
        organizationId,
        baseUrl,
        authClient,
      });

      const doc = documentQuery.data.document;
      let textContent: string | undefined;

      if (isTextBasedFile(doc.mimeType)) {
        textContent = await FileSystem.readAsStringAsync(fileUri);
      }

      return {
        uri: fileUri,
        doc,
        textContent,
      } as DocumentFile;
    },
    enabled: documentQuery.isSuccess && documentQuery.data != null,
  });

  const isLoading = documentQuery.isLoading || documentFileQuery.isLoading;
  const error = documentQuery.error ?? documentFileQuery.error;
  const documentFile = documentFileQuery.data;
  const documentName = documentFile?.doc.name ?? 'Document';

  const handleShowError = (message: string) => {
    showAlert({ title: 'Error', message });
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState styles={styles} themeColors={themeColors} />;
    }

    if (error != null) {
      return (
        <ErrorState
          styles={styles}
          themeColors={themeColors}
          onRetry={() => void documentQuery.refetch()}
          onGoBack={() => router.back()}
        />
      );
    }

    if (documentFile != null) {
      return (
        <View style={styles.documentContainer}>
          <DocumentViewer
            file={documentFile}
            styles={styles}
            themeColors={themeColors}
            onError={handleShowError}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {documentName}
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setIsActionSheetVisible(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      <DocumentActionSheet
        visible={isActionSheetVisible}
        document={documentFile?.doc}
        onClose={() => setIsActionSheetVisible(false)}
        excludedActions={['view']}
      />

      {renderContent()}
    </SafeAreaView>
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
      marginHorizontal: 16,
    },
    documentContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    documentViewer: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    textViewer: {
      flex: 1,
    },
    textViewerContent: {
      padding: 16,
    },
    textContent: {
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 20,
      color: themeColors.foreground,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    centeredTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginTop: 16,
    },
    centeredText: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      marginTop: 8,
      textAlign: 'center',
    },
    actionButton: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      marginTop: 16,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primary,
    },
  });
}
