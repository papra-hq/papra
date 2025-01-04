export function promptUploadFiles({
  acceptedTypes,
}: {
  acceptedTypes?: string;
} = {}): Promise<{ files: File[] }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    if (acceptedTypes) {
      input.accept = acceptedTypes;
    }

    input.onchange = () => {
      resolve({ files: [...input.files ?? []] });
    };

    input.click();
  });
}
