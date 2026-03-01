import type { ScanOutputFormat } from './documents-scan.types';
import type { LocalDocument } from '@/modules/api/api.models';
import { joinUrlPaths } from '@corentinth/chisels';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { fileToBase64DataUrl, getMimeTypeForExtension } from '@/modules/lib/file/file.services';
import { getExtension } from '@/modules/lib/path/path.models';
import { SCANS_DIRECTORY_PATH } from './documents-scan.constants';

export async function processScannedImages({ imageUris, format, baseName }: { imageUris: string[]; format: ScanOutputFormat; baseName: string }): Promise<{ localDocuments: LocalDocument[] }> {
  if (format === 'pdf-merged') {
    const { pdfUri } = await convertImagesToPdf({ imageUris });
    const fileName = `${baseName}.pdf`;
    const { permanentUri } = await moveToPermanentScanStorage({ fileUri: pdfUri, fileName });

    return {
      localDocuments: [
        {
          uri: permanentUri,
          name: fileName,
          type: 'application/pdf',
        },
      ],
    };
  }

  if (format === 'pdf-per-page') {
    const localDocuments: LocalDocument[] = [];

    for (const [i, imageUri] of imageUris.entries()) {
      const { pdfUri } = await convertImagesToPdf({ imageUris: [imageUri] });
      const fileName = `${baseName}_${i + 1}.pdf`;
      const { permanentUri } = await moveToPermanentScanStorage({ fileUri: pdfUri, fileName });

      localDocuments.push({
        uri: permanentUri,
        name: fileName,
        type: 'application/pdf',
      });
    }

    return { localDocuments };
  }

  if (format === 'images') {
    const localDocuments: LocalDocument[] = [];

    for (const [i, imageUri] of imageUris.entries()) {
      const extension = getExtension(imageUri) ?? 'jpg';
      const mimeType = getMimeTypeForExtension({ extension });
      const fileName = `${baseName}_${i + 1}.${extension}`;

      const { permanentUri } = await moveToPermanentScanStorage({ fileUri: imageUri, fileName });

      localDocuments.push({
        uri: permanentUri,
        name: fileName,
        type: mimeType,
      });
    }

    return { localDocuments };
  }

  return { localDocuments: [] };
}

async function ensureScansDirectory(): Promise<void> {
  const { exists } = await FileSystem.getInfoAsync(SCANS_DIRECTORY_PATH);

  if (!exists) {
    await FileSystem.makeDirectoryAsync(SCANS_DIRECTORY_PATH, { intermediates: true });
  }
}

export async function moveToPermanentScanStorage({ fileUri, fileName }: { fileUri: string; fileName: string }): Promise<{ permanentUri: string }> {
  await ensureScansDirectory();

  const permanentUri = joinUrlPaths(SCANS_DIRECTORY_PATH, fileName);

  await FileSystem.moveAsync({
    from: fileUri,
    to: permanentUri,
  });

  return { permanentUri };
}

export async function convertImagesToPdf({ imageUris }: { imageUris: string[] }): Promise<{ pdfUri: string }> {
  const imagesDataUrls = await Promise.all(imageUris.map(async imageUri => fileToBase64DataUrl({ fileUri: imageUri })));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            margin: 0;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .page {
            page-break-after: always;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            min-height: 100vh;
          }
          img {
            max-width: 100%;
            max-height: 100vh;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        ${imagesDataUrls
          .map(imageDataUrl => `<div class="page"><img src="${imageDataUrl}" /></div>`)
          .join('')}
      </body>
    </html>
  `;

  const { uri: pdfUri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return { pdfUri };
}
