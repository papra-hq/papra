export async function collectStreamToFile({ fileStream, fileName, mimeType }: { fileStream: ReadableStream; fileName: string; mimeType: string }): Promise<{ file: File }> {
  const response = new Response(fileStream);
  const blob = await response.blob();

  const file = new File([blob], fileName, { type: mimeType });

  return { file };
}
