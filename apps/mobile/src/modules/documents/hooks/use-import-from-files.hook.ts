import * as DocumentPicker from 'expo-document-picker';

const SUPPORTED_DOCUMENT_TYPES = [
  'image/*',
  'text/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function useImportFromFiles() {
  const importFromFiles = async ({ selectableTypes = SUPPORTED_DOCUMENT_TYPES }: { selectableTypes?: string[] } = {}) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: selectableTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return { localDocument: undefined };
    }

    if (result.assets.length === 0) {
      return { localDocument: undefined };
    }

    const firstAsset = result.assets[0];

    if (!firstAsset) {
      // For type safety, array length was already checked
      return { localDocument: undefined };
    }

    return {
      localDocument: {
        uri: firstAsset.uri,
        name: firstAsset.name,
        type: firstAsset.mimeType,
      },
    };
  };

  return { importFromFiles };
}
