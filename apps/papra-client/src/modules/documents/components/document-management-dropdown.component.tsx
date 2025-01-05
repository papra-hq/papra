import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import type { Component } from 'solid-js';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { createToast } from '@/modules/ui/components/sonner';
import { A } from '@solidjs/router';
import { deleteDocument } from '../documents.services';

export const DocumentManagementDropdown: Component<{ documentId: string; organizationId: string }> = (props) => {
  const deleteDoc = async () => {
    await deleteDocument({
      documentId: props.documentId,
      organizationId: props.organizationId,
    });

    await queryClient.invalidateQueries({ queryKey: ['organizations', props.organizationId, 'documents'] });
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
          href={`/organizations/${props.organizationId}/documents/${props.documentId}`}
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
