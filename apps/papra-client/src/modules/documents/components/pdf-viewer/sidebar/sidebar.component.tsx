import type { Component } from 'solid-js';
import type { ThumbnailsBarProps, ThumbnailsBarTab } from '../pdf-viewer.types';
import { createSignal } from 'solid-js';
import { AttachmentsPanel } from './attachments-panel.component';
import { OutlinePanel } from './outline-panel.component';
import { SidebarButtonsBar } from './sidebar-buttons-bar.component';
import { ThumbnailsPanel } from './thumbnails-panel.component';

export const SideBar: Component<ThumbnailsBarProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<ThumbnailsBarTab>('thumbnails');

  return (
    <div class="h-full w-full flex relative bg-card border-r shrink-0">
      <SidebarButtonsBar
        store={props.store}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div class="flex-1 relative transition-all duration-200">
        <ThumbnailsPanel
          show={activeTab() === 'thumbnails'}
          store={props.store}
          thumbsRef={props.thumbsRef}
        />
        <OutlinePanel
          show={activeTab() === 'outline'}
          store={props.store}
        />
        <AttachmentsPanel
          show={activeTab() === 'attachments'}
          store={props.store}
        />
      </div>
    </div>
  );
};
