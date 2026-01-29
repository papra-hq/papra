import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
]);

function isTextBasedFile(mimeType: string): boolean {
  return mimeType.startsWith('text/') || textMimeTypes.has(mimeType);
}

export default function DocumentViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string; organizationId: string }>();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const apiClient = useApiClient();
  const authClient = useAuthClient();
  const { documentId, organizationId } = params;
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

  const documentQuery = useQuery({
    queryKey: ['organizations', organizationId, 'documents', documentId],
    queryFn: async () => {
      if (organizationId == null || documentId == null) {
        throw new Error('Organization ID and Document ID are required');
      }
      return fetchDocument({ organizationId, documentId, apiClient });
    },
    enabled: organizationId != null && documentId != null,
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

  const renderHeader = (documentName: string) => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={themeColors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {documentName}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setIsActionSheetVisible(true)}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={themeColors.foreground}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDocumentFile = (file: DocumentFile) => {
    if (file.doc.mimeType.startsWith('image/')) {
      return (
        <Image
          source={{ uri: file.uri }}
          style={styles.pdfViewer}
        />
      );
    }
    if (file.doc.mimeType.startsWith('application/pdf')) {
      return (
        <Pdf
          source={{ uri: file.uri, cache: true }}
          style={styles.pdfViewer}
          onError={(error) => {
            console.error('PDF error:', error);
            showAlert({
              title: 'Error',
              message: 'Failed to load PDF',
            });
          }}
          enablePaging={true}
          horizontal={false}
          enableAnnotationRendering={true}
          fitPolicy={0}
          spacing={10}
        />
      );
    }
    if (file.textContent != null) {
      return (
        <ScrollView
          style={styles.textViewer}
          contentContainerStyle={styles.textViewerContent}
        >
          <Text style={styles.textContent} selectable>
            {file.textContent}
          </Text>
        </ScrollView>
      );
    }
    return (
      <View style={styles.unsupportedContainer}>
        <MaterialCommunityIcons
          name="file-question-outline"
          size={64}
          color={themeColors.mutedForeground}
        />
        <Text style={styles.unsupportedTitle}>Preview not available</Text>
        <Text style={styles.unsupportedText}>
          This file type cannot be previewed in the app
        </Text>
      </View>
    );
  };

  const isLoading = documentQuery.isLoading || documentFileQuery.isLoading;
  const error = documentQuery.error ?? documentFileQuery.error;
  const documentFile = documentFileQuery.data;
  const documentName = documentFile?.doc.name ?? 'Document';

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader(documentName)}
      <DocumentActionSheet
        visible={isActionSheetVisible}
        document={documentFile?.doc}
        onClose={() => setIsActionSheetVisible(false)}
        excludedActions={['view']}
      />
      {isLoading
        ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          )
        : error != null
          ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={64}
                  color={themeColors.mutedForeground}
                />
                <Text style={styles.errorText}>Failed to load document</Text>
                <TouchableOpacity
                  style={styles.errorButton}
                  onPress={() => {
                    void documentQuery.refetch();
                  }}
                >
                  <Text style={styles.errorButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.errorButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.errorButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            )
          : documentFile != null
            ? (
                <View style={styles.pdfContainer}>
                  {renderDocumentFile(documentFile)}
                </View>
              )
            : null}
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
    pdfContainer: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    pdfViewer: {
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
    unsupportedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    unsupportedTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.foreground,
      marginTop: 16,
    },
    unsupportedText: {
      fontSize: 14,
      color: themeColors.mutedForeground,
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: themeColors.mutedForeground,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    errorText: {
      fontSize: 18,
      color: themeColors.foreground,
      marginTop: 16,
      marginBottom: 24,
    },
    errorButton: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: themeColors.secondaryBackground,
      borderRadius: 12,
      marginTop: 16,
    },
    errorButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.primary,
    },
  });
}
