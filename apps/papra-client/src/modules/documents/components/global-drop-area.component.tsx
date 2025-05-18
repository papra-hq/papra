import type { Component } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

export const GlobalDropArea: Component<{ onFilesDrop?: (args: { files: File[] }) => void }> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (e.relatedTarget === null) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);

    if (files.length === 0) {
      return;
    }

    props.onFilesDrop?.({ files });
  };

  // Adding global event listeners for drag and drop
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);

  // Cleanup listeners when component unmounts
  onCleanup(() => {
    document.removeEventListener('dragover', handleDragOver);
    document.removeEventListener('dragleave', handleDragLeave);
    document.removeEventListener('drop', handleDrop);
  });

  return (
    <div
      class={cn('fixed top-0 left-0 w-screen h-screen z-80 bg-background bg-opacity-50 backdrop-blur transition-colors', isDragging() ? 'block' : 'hidden')}
    >
      <div class="flex items-center justify-center h-full text-center flex-col">
        <div class="i-tabler-file-plus text-6xl text-muted-foreground mx-auto"></div>
        <div class="text-xl my-2 font-semibold text-muted-foreground">
          Drop files here
        </div>
        <div class="text-base text-muted-foreground">
          Drag and drop files here to import them
        </div>
      </div>
    </div>
  );
};
