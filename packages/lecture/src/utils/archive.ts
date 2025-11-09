import JSZip from 'jszip';

export async function getFileContentFromArchive({ arrayBuffer, filePath }: { arrayBuffer: ArrayBuffer; filePath: string }): Promise<string | undefined> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  const document = await zip.file(filePath)?.async('text');

  return document;
}
