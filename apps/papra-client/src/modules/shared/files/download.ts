export function downloadFile({ url, fileName = 'file' }: { url: string; fileName?: string }) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
}
