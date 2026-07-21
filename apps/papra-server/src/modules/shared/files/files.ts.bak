export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString('base64');
  return base64String;
}

export async function fileToBase64DataUrl(file: File): Promise<string> {
  const base64String = await fileToBase64(file);
  return `data:${file.type};base64,${base64String}`;
}
