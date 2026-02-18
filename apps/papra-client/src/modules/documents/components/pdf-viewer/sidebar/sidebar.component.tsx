import type { Component, ParentComponent } from 'solid-js';
import type { ThumbnailsBarProps, ThumbnailsBarTab } from '../pdf-viewer.types';
import { createSignal } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { AttachmentsPanel } from './attachments-panel.component';
import { OutlinePanel } from './outline-panel.component';
import { SidebarButtonsBar } from './sidebar-buttons-bar.component';
import { ThumbnailsPanel } from './thumbnails-panel.component';

const SideBarPanel: ParentComponent<{ active: boolean }> = (props) => {
  return (
    <div
      class={cn('absolute inset-0 flex flex-col overflow-y-auto transition-opacity z-10', { 'opacity-0 pointer-events-none z-0': !props.active })}
      aria-hidden={!props.active}
    >
      {props.children}
    </div>
  );
};

export const SideBar: Component<ThumbnailsBarProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<ThumbnailsBarTab>('thumbnails');

  return (
    <div class="h-full w-full flex relative bg-card border-r shrink-0">
      <SidebarButtonsBar
        store={props.store}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div class="flex-1 relative overflow-hidden min-h-0">

        <SideBarPanel active={activeTab() === 'thumbnails'}>
          <ThumbnailsPanel store={props.store} thumbsRef={props.thumbsRef} />
        </SideBarPanel>

        <SideBarPanel active={activeTab() === 'outline'}>
          <OutlinePanel store={props.store} />
        </SideBarPanel>

        <SideBarPanel active={activeTab() === 'attachments'}>
          <AttachmentsPanel store={props.store} />
        </SideBarPanel>

      </div>
    </div>
  );
};
