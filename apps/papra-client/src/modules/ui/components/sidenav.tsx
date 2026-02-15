import type { Component, ComponentProps, JSX } from 'solid-js';
import { A } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Button } from './button';

export type SideNavSubMenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: JSX.Element;
};

export type SideNavMenuItem = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: JSX.Element;
  subMenu?: SideNavSubMenuItem[];
  expanded?: boolean;
  onToggleExpanded?: () => void;
};

const MenuItemButton: Component<SideNavMenuItem> = (props) => {
  return (
    <Button
      class="justify-start items-center gap-2 dark:text-muted-foreground truncate"
      variant="ghost"
      {...(props.onClick
        ? { onClick: props.onClick }
        : { as: A, href: props.href, activeClass: 'bg-accent/50! text-accent-foreground! truncate', end: true } as ComponentProps<typeof Button>)
      }
    >
      <div class={cn(props.icon, 'size-5 text-muted-foreground opacity-50')} />
      <div>{props.label}</div>
      {props.badge && <div class="ml-auto">{props.badge}</div>}
    </Button>
  );
};

const MenuItemWithSubmenuButton: Component<SideNavMenuItem> = (props) => {
  return (
    <div class="flex flex-col">
      <div class="flex items-center gap-0.5">
        <Button
          class="flex-1 justify-start items-center gap-2 dark:text-muted-foreground truncate"
          variant="ghost"
          {...(props.onClick
            ? { onClick: props.onClick }
            : { as: A, href: props.href, activeClass: 'bg-accent/50! text-accent-foreground! truncate', end: true } as ComponentProps<typeof Button>)
          }
        >
          <div class={cn(props.icon, 'size-5 text-muted-foreground opacity-50')} />
          <div>{props.label}</div>
          {props.badge && <div class="ml-auto">{props.badge}</div>}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-9 w-9 shrink-0"
          onClick={props.onToggleExpanded}
        >
          <div class={cn('size-4 text-muted-foreground opacity-50 transition-transform', props.expanded ? 'i-tabler-chevron-down' : 'i-tabler-chevron-right')} />
        </Button>
      </div>
      <Show when={props.expanded && props.subMenu && props.subMenu.length > 0}>
        <nav class="flex flex-col gap-0.5 mt-0.5 ml-6 border-l pl-3">
          <For each={props.subMenu}>{subItem => (
            <Button
              class="justify-start items-center gap-2 dark:text-muted-foreground truncate text-xs h-8 px-2"
              variant="ghost"
              {...(subItem.onClick
                ? { onClick: subItem.onClick }
                : { as: A, href: subItem.href, activeClass: 'bg-accent/50! text-accent-foreground! truncate', end: true } as ComponentProps<typeof Button>)
              }
            >
              {subItem.icon}
              <div class="truncate">{subItem.label}</div>
            </Button>
          )}</For>
        </nav>
      </Show>
    </div>
  );
};

export const SideNav: Component<{
  mainMenu?: SideNavMenuItem[];
  footerMenu?: SideNavMenuItem[];
  header?: Component;
  footer?: Component;
  preFooter?: Component;
}> = (props) => {
  return (
    <div class="flex h-full">
      {(props.header || props.mainMenu || props.footerMenu || props.footer || props.preFooter) && (
        <div class="h-full flex flex-col pb-6 flex-1 min-w-0">
          {props.header && <props.header />}

          {props.mainMenu && (
            <nav class="flex flex-col gap-0.5 mt-4 px-4">
              <For each={props.mainMenu}>{menuItem => (
                menuItem.subMenu
                  ? <MenuItemWithSubmenuButton {...menuItem} />
                  : <MenuItemButton {...menuItem} />
              )}</For>
            </nav>
          )}

          <div class="flex-1" />

          {props.preFooter && <props.preFooter />}

          {props.footerMenu && (
            <nav class="flex flex-col gap-0.5 px-4">
              <For each={props.footerMenu}>{menuItem => <MenuItemButton {...menuItem} />}</For>
            </nav>
          )}

          {props.footer && <props.footer />}
        </div>
      )}
    </div>
  );
};
