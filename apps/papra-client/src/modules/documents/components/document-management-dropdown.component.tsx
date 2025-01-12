import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { useConfirmModal } from '@/modules/shared/confirm';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { createToast } from '@/modules/ui/components/sonner';
import { A } from '@solidjs/router';
import { deleteDocument } from '../documents.services';

export const DocumentManagementDropdown: Component<{ document: Document }> = (props) => {
  const { confirm } = useConfirmModal();

  const deleteDoc = async () => {
    const isConfirmed = await confirm({
      title: 'Delete document',
      message: (
        <>
          Are you sure you want to delete
          {' '}
          <span class="font-bold">{props.document.name}</span>
          ?
        </>
      ),
      confirmButton: {
        text: 'Delete document',
        variant: 'destructive',
      },
      cancelButton: {
        text: 'Cancel',
      },
    });

    if (!isConfirmed) {
      return;
    }

    await deleteDocument({
      documentId: props.document.id,
      organizationId: props.document.organizationId,
    });

    await queryClient.invalidateQueries({ queryKey: ['organizations', props.document.organizationId, 'documents'] });
    createToast({ type: 'success', message: 'Document deleted' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={(props: DropdownMenuSubTriggerProps) => (
          <Button variant="ghost" size="icon" {...props}>
            <div class="i-tabler-dots-vertical size-4"></div>
          </Button>
        )}
      />
      <DropdownMenuContent class="w-48">
        <DropdownMenuItem
          class="cursor-pointer "
          as={A}
          href={`/organizations/${props.document.organizationId}/documents/${props.document.id}`}
        >
          <div class="i-tabler-info-circle size-4 mr-2"></div>
          <span>Document details</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          class="cursor-pointer text-red"
          onClick={() => deleteDoc()}
        >
          <div class="i-tabler-trash size-4 mr-2"></div>
          <span>Delete document</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
