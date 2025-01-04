import type { Component } from 'solid-js';
import { promptUploadFiles } from '@/modules/shared/files/upload';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { useParams } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { uploadDocument } from '../documents.services';

export const DocumentUploadArea: Component<{ organizationId?: string }> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const params = useParams();

  const getOrganizationId = () => props.organizationId ?? params.organizationId;

  const uploadFiles = async ({ files }: { files: File[] }) => {
    for (const file of files) {
      await uploadDocument({ file, organizationId: getOrganizationId() });
    }

    await queryClient.invalidateQueries({
      queryKey: ['organizations', getOrganizationId(), 'documents'],
      refetchType: 'all',
    });
  };

  const promptImport = async () => {
    const { files } = await promptUploadFiles();
    await uploadFiles({ files });
  };

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
    await uploadFiles({ files });
  };

  return (
    <div
      class={cn('border border-[2px] border-dashed text-muted-foreground rounded-lg p-6 sm:py-16 flex flex-col items-center justify-center text-center', { 'border-primary': isDragging() })}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div class="i-tabler-cloud-upload size-12 mb-4"></div>
      <p>{isDragging() ? 'Drop files to upload' : 'Drag and drop files here to upload'}</p>

      <Button class="mt-4" variant="outline" onClick={promptImport}>
        <div class="i-tabler-upload mr-2"></div>
        Select files
      </Button>
    </div>
  );
};
