import DocumentScanner from 'react-native-document-scanner-plugin';

export async function scanDocuments(): Promise<{ scannedImageUris?: string[] }> {
  const { scannedImages, status } = await DocumentScanner.scanDocument({
    croppedImageQuality: 100,
  });

  if (status !== 'success') {
    return { scannedImageUris: undefined };
  }

  if (!scannedImages || scannedImages.length === 0) {
    return { scannedImageUris: undefined };
  }

  return { scannedImageUris: scannedImages };
}
