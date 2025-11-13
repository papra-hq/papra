import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { useDocumentUpload } from './document-import-status.component';

export const DocumentUploadArea: Component = () => {
  const [isDragging, setIsDragging] = createSignal(false);

  const { promptImport, uploadDocuments } = useDocumentUpload();

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (!event.dataTransfer?.files) {
      return;
    }

    const files = [...event.dataTransfer.files].filter(file => file.type === 'application/pdf');
    await uploadDocuments({ files });
  };

  return (
    <div
      class={cn('border border-[2px] border-dashed text-muted-foreground rounded-lg p-6 sm:py-16 flex flex-col items-center justify-center text-center', { 'border-primary': isDragging() })}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div class="i-tabler-cloud-upload size-12 mb-4" />
      <p>{isDragging() ? 'Drop files to upload' : 'Drag and drop files here to upload'}</p>

      <Button class="mt-4" variant="outline" onClick={promptImport}>
        <div class="i-tabler-upload mr-2" />
        Select files
      </Button>
    </div>
  );
};
