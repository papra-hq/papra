import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import type { Component } from 'solid-js';
import type { Document } from '../documents.types';
import { A } from '@solidjs/router';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { getDocumentOpenWithApps } from '../document.models';
import { useDeleteDocument } from '../documents.composables';
import { DocumentOpenWithDropdownItems } from './open-with.component';
import { useRenameDocumentDialog } from './rename-document-button.component';

export const DocumentManagementDropdown: Component<{ document: Document }> = (props) => {
  const { deleteDocument } = useDeleteDocument();
  const { openRenameDialog } = useRenameDocumentDialog();
  const { t } = useI18n();

  const deleteDoc = () => deleteDocument({
    documentId: props.document.id,
    organizationId: props.document.organizationId,
    documentName: props.document.name,
  });

  const getOpenWithApps = () => getDocumentOpenWithApps({ document: props.document });

  return (

    <DropdownMenu>
      <DropdownMenuTrigger
        as={(props: DropdownMenuSubTriggerProps) => (
          <Button variant="ghost" size="icon" {...props}>
            <div class="i-tabler-dots-vertical size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent class="w-48">
        <DropdownMenuItem
          class="cursor-pointer "
          as={A}
          href={`/organizations/${props.document.organizationId}/documents/${props.document.id}`}
        >
          <div class="i-tabler-info-circle size-4 mr-2" />
          <span>Document details</span>
        </DropdownMenuItem>

        <Show when={getOpenWithApps().length > 0}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="cursor-pointer">
              <div class="i-tabler-app-window size-4 mr-2" />
              <span>{t('documents.open-with.label')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DocumentOpenWithDropdownItems apps={getOpenWithApps()} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </Show>

        <DropdownMenuItem
          class="cursor-pointer"
          onClick={() => openRenameDialog({
            documentId: props.document.id,
            organizationId: props.document.organizationId,
            documentName: props.document.name,
          })}
        >
          <div class="i-tabler-pencil size-4 mr-2" />
          <span>Rename document</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          class="cursor-pointer text-red"
          onClick={() => deleteDoc()}
        >
          <div class="i-tabler-trash size-4 mr-2" />
          <span>Delete document</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  );
};
