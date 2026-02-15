import type { Component } from 'solid-js';
import type { PDFSlickState } from '../pdf-viewer.types';
import type { TranslationKeys } from '@/modules/i18n/locales.types';
import { formatBytes } from '@corentinth/chisels';
import { For, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/modules/ui/components/dialog';

type DocumentPropertiesDialogProps = {
  store: PDFSlickState;
  isOpen: boolean;
  onClose: () => void;
};

const PropertyRow: Component<{ label: string; value?: string | number | null; naText: string }> = (props) => {
  return (
    <div class="grid grid-cols-3 gap-4 px-4 mx--4 py-1.5 rounded-sm hover:bg-muted/50">
      <dt class="text-sm font-medium text-muted-foreground">{props.label}</dt>
      <dd class="text-sm col-span-2">
        <Show
          when={props.value != null && props.value !== ''}
          fallback={<span class="text-xs text-muted-foreground/60">{props.naText}</span>}
        >
          {props.value}
        </Show>
      </dd>
    </div>
  );
};

export const DocumentPropertiesDialog: Component<DocumentPropertiesDialogProps> = (props) => {
  const { t, formatDate } = useI18n();

  const getPageSizeString = () => {
    const ps: unknown = props.store.pageSize;

    if (!ps || typeof ps !== 'object' || !('width' in ps) || !('height' in ps)) {
      return undefined;
    }

    return `${ps.width} x ${ps.height}`;
  };

  const getProperties = (): { label: TranslationKeys; value?: string | number | null }[] => [
    {
      label: 'documents.pdf-viewer.properties.file-name',
      value: props.store.filename,
    },
    {
      label: 'documents.pdf-viewer.properties.file-size',
      value: props.store.filesize ? formatBytes({ bytes: props.store.filesize, base: 1024 }) : undefined,
    },
    {
      label: 'documents.pdf-viewer.properties.doc-title',
      value: props.store.title,
    },
    {
      label: 'documents.pdf-viewer.properties.author',
      value: props.store.author,
    },
    {
      label: 'documents.pdf-viewer.properties.subject',
      value: props.store.subject,
    },
    {
      label: 'documents.pdf-viewer.properties.keywords',
      value: props.store.keywords,
    },
    {
      label: 'documents.pdf-viewer.properties.creation-date',
      value: props.store.creationDate ? formatDate(props.store.creationDate) : undefined,
    },
    {
      label: 'documents.pdf-viewer.properties.modification-date',
      value: props.store.modificationDate ? formatDate(props.store.modificationDate) : undefined,
    },
    {
      label: 'documents.pdf-viewer.properties.creator',
      value: props.store.creator,
    },
    {
      label: 'documents.pdf-viewer.properties.pdf-producer',
      value: props.store.producer,
    },
    {
      label: 'documents.pdf-viewer.properties.pdf-version',
      value: props.store.version,
    },
    {
      label: 'documents.pdf-viewer.properties.page-count',
      value: props.store.numPages,
    },
    {
      label: 'documents.pdf-viewer.properties.page-size',
      value: getPageSizeString(),
    },
    {
      label: 'documents.pdf-viewer.properties.fast-web-view',
      value: props.store.isLinearized ? t('documents.pdf-viewer.properties.yes') : t('documents.pdf-viewer.properties.no'),
    },
  ];

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('documents.pdf-viewer.properties.title')}</DialogTitle>
        </DialogHeader>

        <dl>
          <For each={getProperties()}>
            {({ label, value }) => (
              <PropertyRow label={t(label)} value={value} naText={t('documents.pdf-viewer.properties.na')} />
            )}
          </For>
        </dl>
      </DialogContent>
    </Dialog>
  );
};
