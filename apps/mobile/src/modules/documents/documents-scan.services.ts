import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

export async function convertImagesToPdf(imageUris: string[]): Promise<string> {
  const images = imageUris.map(async (imageUri) => {
    try {
      // Read the image file
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Detect image format from URI
      let imageType = 'jpeg';
      if (imageUri.toLowerCase().includes('.png')) {
        imageType = 'png';
      } else if (imageUri.toLowerCase().includes('.jpg') || imageUri.toLowerCase().includes('.jpeg')) {
        imageType = 'jpeg';
      }

      return { imageType, base64Image };
    } catch (error) {
      console.error('Error converting image to PDF:', error);
      throw error;
    }
  });

  // Create HTML with the image embedded
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
      ${(
        await Promise.all(images)
      )
        .map(
          image => `
            <div class="page">
              <img src="data:image/${image.imageType};base64,${image.base64Image}" />
            </div>
          `,
        )
        .join('')}
    </body>
  </html>
`;

  // Generate PDF from HTML
  const { uri: pdfUri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return pdfUri;
}
