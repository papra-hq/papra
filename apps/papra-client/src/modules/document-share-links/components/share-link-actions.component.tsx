import type { DropdownMenuSubTriggerProps } from '@kobalte/core/dropdown-menu';
import type { Component } from 'solid-js';
import type { ShareLink } from '../document-share-links.types';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/ui/components/dropdown-menu';
import {
  useCopyShareLink,
  useDeleteShareLink,
  useToggleShareLink,
} from '../document-share-links.composables';

export const ShareLinkActions: Component<{ shareLink: ShareLink; withGoToDocument?: boolean }> = (
  props,
) => {
  const { t } = useI18n();
  const { copyShareLink } = useCopyShareLink();
  const { toggleShareLink } = useToggleShareLink();
  const { deleteShareLink } = useDeleteShareLink();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={(triggerProps: DropdownMenuSubTriggerProps) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('document-share-links.actions.menu')}
            {...triggerProps}
          >
            <div class="i-tabler-dots-vertical size-4" />
          </Button>
        )}
      />
      <DropdownMenuContent class="w-48">
        {(props.withGoToDocument ?? true) && (
          <DropdownMenuItem
            class="cursor-pointer"
            as={A}
            href={`/organizations/${props.shareLink.organizationId}/documents/${props.shareLink.documentId}`}
          >
            <div class="i-tabler-file-text size-4 mr-2" />
            <span>{t('document-share-links.actions.open-document')}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          class="cursor-pointer"
          onClick={() => copyShareLink({ url: props.shareLink.url })}
        >
          <div class="i-tabler-copy size-4 mr-2" />
          <span>{t('document-share-links.copy')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          class="cursor-pointer"
          onClick={() =>
            toggleShareLink({
              organizationId: props.shareLink.organizationId,
              shareLinkId: props.shareLink.id,
              isEnabled: !props.shareLink.isEnabled,
            })
          }
        >
          <div
            class={`${props.shareLink.isEnabled ? 'i-tabler-eye-off' : 'i-tabler-eye'} size-4 mr-2`}
          />
          <span>
            {props.shareLink.isEnabled
              ? t('document-share-links.actions.disable')
              : t('document-share-links.actions.enable')}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          class="cursor-pointer text-red"
          onClick={() =>
            deleteShareLink({
              organizationId: props.shareLink.organizationId,
              shareLinkId: props.shareLink.id,
            })
          }
        >
          <div class="i-tabler-trash size-4 mr-2" />
          <span>{t('document-share-links.actions.stop-sharing')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
