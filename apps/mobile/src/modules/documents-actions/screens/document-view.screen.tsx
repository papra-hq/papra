import type { CoerceDates } from '@/modules/api/api.models';
import type { Document } from '@/modules/documents/documents.types';
import type { ThemeColors } from '@/modules/ui/theme.constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient, useAuthClient } from '@/modules/api/providers/api.provider';
import { configLocalStorage } from '@/modules/config/config.local-storage';
import { fetchDocument, fetchDocumentFile } from '@/modules/documents/documents.services';
import { useAlert } from '@/modules/ui/providers/alert-provider';
import { useThemeColor } from '@/modules/ui/providers/use-theme-color';

type DocumentFile = {
  uri: string;
  doc: CoerceDates<Document>;
};

export default function DocumentViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ documentId: string; organizationId: string }>();
  const themeColors = useThemeColor();
  const styles = createStyles({ themeColors });
  const { showAlert } = useAlert();
  const apiClient = useApiClient();
  const authClient = useAuthClient();
  const { documentId, organizationId } = params;
  const [loading, setLoading] = useState(true);
  const [documentFile, setDocumentFile] = useState<DocumentFile | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const loadDocumentFile = async (doc: CoerceDates<Document>) => {
    try {
      setLoadingDoc(true);
      const baseUrl = await configLocalStorage.getApiServerBaseUrl();
      if (baseUrl == null) {
        throw new Error('Base URL not found');
      }

      const fileUri = await fetchDocumentFile({
        document: doc,
        organizationId,
        baseUrl,
        authClient,
      });

      setDocumentFile({ uri: fileUri, doc });
    } catch (error) {
      console.error('Error loading document file:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load document file',
      });
    } finally {
      setLoadingDoc(false);
    }
  };

  const loadDocument = async () => {
    try {
      const { document } = await fetchDocument({ organizationId, documentId, apiClient });

      // Download file locally for viewer
      await loadDocumentFile(document);
    } catch (error) {
      console.error('Error loading document:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load document',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocument();
  }, [documentId, organizationId]);

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
    return <View style={styles.pdfViewer} />;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && !documentFile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="file-pdf-box"
            size={64}
            color={themeColors.mutedForeground}
          />
          <Text style={styles.errorText}>Document not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const documentName = documentFile?.doc.name ?? 'PDF Viewer';
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
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
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.pdfContainer}>
        {loadingDoc
          ? (
              <View style={styles.pdfLoadingContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={styles.pdfLoadingText}>Loading document...</Text>
              </View>
            )
          : documentFile
            ? renderDocumentFile(documentFile)
            : (
                <View style={styles.pdfLoadingContainer}>
                  <ActivityIndicator size="large" color={themeColors.primary} />
                  <Text style={styles.pdfLoadingText}>Preparing document...</Text>
                </View>
              )}
      </View>
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
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: 'bold',
      color: themeColors.foreground,
      marginHorizontal: 16,
    },
    headerSpacer: {
      width: 40,
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
    pdfLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    pdfLoadingText: {
      marginTop: 16,
      fontSize: 16,
      color: themeColors.mutedForeground,
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
