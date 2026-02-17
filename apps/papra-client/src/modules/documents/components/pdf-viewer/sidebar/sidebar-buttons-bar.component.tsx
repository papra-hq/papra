import type { Accessor, Component, Setter } from 'solid-js';
import type { PDFSlickState, ThumbnailsBarTab } from '../pdf-viewer.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';

type SidebarButtonsBarProps = {
  store: PDFSlickState;
  activeTab: Accessor<ThumbnailsBarTab>;
  setActiveTab: Setter<ThumbnailsBarTab>;
};

export const SidebarButtonsBar: Component<SidebarButtonsBarProps> = (props) => {
  const { t } = useI18n();

  return (
    <div class="z-10 flex flex-col p-1 gap-1 items-center border-r shrink-0">
      <Tooltip placement="right">
        <TooltipTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              {...triggerProps}
              variant={props.activeTab() === 'thumbnails' ? 'secondary' : 'ghost'}
              size="icon"
              class="size-8"
              disabled={!props.store.pdfSlick}
              onClick={() => props.setActiveTab('thumbnails')}
            >
              <div class="i-tabler-layout-grid size-4" />
            </Button>
          )}
        />
        <TooltipContent>{t('documents.pdf-viewer.sidebar.page-thumbnails')}</TooltipContent>
      </Tooltip>

      <Tooltip placement="right">
        <TooltipTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              {...triggerProps}
              variant={props.activeTab() === 'outline' ? 'secondary' : 'ghost'}
              size="icon"
              class="size-8"
              disabled={!props.store.documentOutline}
              onClick={() => props.setActiveTab('outline')}
            >
              <div class="i-tabler-list-tree size-4" />
            </Button>
          )}
        />
        <TooltipContent>{t('documents.pdf-viewer.sidebar.document-outline')}</TooltipContent>
      </Tooltip>

      <Tooltip placement="right">
        <TooltipTrigger
          as={(triggerProps: Record<string, unknown>) => (
            <Button
              {...triggerProps}
              variant={props.activeTab() === 'attachments' ? 'secondary' : 'ghost'}
              size="icon"
              class="size-8"
              disabled={props.store.attachments.size < 1}
              onClick={() => props.setActiveTab('attachments')}
            >
              <div class="i-tabler-paperclip size-4" />
            </Button>
          )}
        />
        <TooltipContent>{t('documents.pdf-viewer.sidebar.attachments')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
