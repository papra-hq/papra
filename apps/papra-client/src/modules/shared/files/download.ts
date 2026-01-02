export function downloadFile({ url, fileName = 'file' }: { url: string; fileName?: string }) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
}

export function downloadTextFile({ content, fileName = 'file.txt' }: { content: string; fileName?: string }) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  downloadFile({ url, fileName });
  URL.revokeObjectURL(url);
}
