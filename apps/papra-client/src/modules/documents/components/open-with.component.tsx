import type { Component } from 'solid-js';
import type { DocumentOpenWithApp } from '../document.models';
import { For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { DropdownMenuItem } from '@/modules/ui/components/dropdown-menu';

export const DocumentOpenWithDropdownItem: Component<{ app: DocumentOpenWithApp }> = (props) => {
  const { t } = useI18n();

  return (
    <DropdownMenuItem
      class="cursor-pointer"
      as="a"
      href={props.app.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class={`${props.app.icon} size-4 mr-2`} />
      <span>{t(props.app.labelKey)}</span>
    </DropdownMenuItem>
  );
};

export const DocumentOpenWithDropdownItems: Component<{ apps: DocumentOpenWithApp[] }> = (props) => {
  return (
    <For each={props.apps}>
      {app => <DocumentOpenWithDropdownItem app={app} />}
    </For>
  );
};
