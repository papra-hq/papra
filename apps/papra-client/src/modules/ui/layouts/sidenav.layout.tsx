import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import { useCommandPalette } from '@/modules/command-palette/command-palette.provider';
import { uploadDocument } from '@/modules/documents/documents.services';
import { promptUploadFiles } from '@/modules/shared/files/upload';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';

import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { A, useParams } from '@solidjs/router';
import { type Component, type ParentComponent, Show, Suspense } from 'solid-js';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/tooltip';

type MenuItem = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
};

const MenuItemButton: Component<MenuItem> = (props) => {
  return (
    <>
      <Show when={props.onClick}>
        <Button class="block" onClick={props.onClick} variant="ghost">
          <div class="flex items-center gap-2 dark:text-muted-foreground truncate">
            <div class={cn(props.icon, 'size-5')}></div>
            <div>{props.label}</div>
          </div>
        </Button>
      </Show>

      <Show when={!props.onClick}>
        <Button class="block dark:text-muted-foreground" as={A} href={props.href!} variant="ghost" activeClass="bg-accent/50! text-accent-foreground! truncate" end>
          <div class="flex items-center gap-2">
            <div class={cn(props.icon, 'size-5')}></div>
            <div class="truncate">{props.label}</div>
          </div>
        </Button>
      </Show>
    </>
  );
};

export const SideNav: Component<{
  mainMenu?: MenuItem[];
  footerMenu?: MenuItem[];
  header?: Component;
  footer?: Component;
}> = (props) => {
  const getShortSideNavItems = () => [
    {
      to: '/organizations',
      label: 'All organizations',
      icon: 'i-tabler-building-community',
    },
    {
      label: 'GitHub repository',
      href: 'https://github.com/papra-hq/papra',
      icon: 'i-tabler-brand-github',
    },
    {
      label: 'Bluesky',
      href: 'https://bsky.app/profile/papra.app',
      icon: 'i-tabler-brand-bluesky',
    },
  ];

  return (
    <div class="flex h-full">
      <div class="w-65px border-r bg-card pt-4">
        <Button variant="link" size="icon" as={A} href="/" class="text-lg font-bold hover:no-underline flex items-center text-primary mb-4 mx-auto">
          <div class="i-tabler-file-text size-10"></div>
        </Button>

        <div class="flex flex-col gap-0.5">
          {getShortSideNavItems().map(menuItem => (
            <Tooltip>
              <TooltipTrigger
                as={(tooltipProps: TooltipTriggerProps) => (
                  <Button
                    variant="link"
                    class="text-lg font-bold hover:no-underline flex items-center text-foreground dark:text-muted-foreground hover:text-primary"
                    {...tooltipProps}
                    aria-label={menuItem.label}
                    {...(menuItem.href
                      ? { as: 'a', href: menuItem.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { as: A, href: menuItem.to })}
                  >
                    <div class={cn(menuItem.icon, 'size-5')} />
                  </Button>
                )}
              />

              <TooltipContent>{menuItem.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

      </div>
      {(props.header || props.mainMenu || props.footerMenu || props.footer) && (
        <div class="h-full flex flex-col pb-6 flex-1">
          {props.header && <props.header />}

          {props.mainMenu && (
            <nav class="flex flex-col gap-0.5 mt-4 px-4">
              {props.mainMenu.map(menuItem => <MenuItemButton {...menuItem} />)}
            </nav>
          )}

          <div class="flex-1"></div>

          {props.footerMenu && (
            <nav class="flex flex-col gap-0.5 px-4">
              {props.footerMenu.map(menuItem => <MenuItemButton {...menuItem} />)}
            </nav>
          )}

          {props.footer && <props.footer />}
        </div>
      )}
    </div>
  );
};

const ThemeSwitcher: Component = () => {
  const themeStore = useThemeStore();

  return (
    <>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'light' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-sun text-lg"></div>
        Light Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'dark' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-moon text-lg"></div>
        Dark Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'system' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-device-laptop text-lg"></div>
        System Mode
      </DropdownMenuItem>
    </>
  );
};

export const SidenavLayout: ParentComponent<{
  sideNav: Component;
  showSearch?: boolean;
}> = (props) => {
  const { user } = useCurrentUser();
  const themeStore = useThemeStore();
  const params = useParams();
  const { openCommandPalette } = useCommandPalette();

  const promptImport = async () => {
    const { files } = await promptUploadFiles();
    for (const file of files) {
      await uploadDocument({ file, organizationId: params.organizationId });
    }

    queryClient.invalidateQueries({
      queryKey: ['organizations', params.organizationId, 'documents'],
      refetchType: 'all',
    });
  };

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-350px border-r border-r-border  flex-shrink-0 hidden md:block bg-card">
        <props.sideNav />

      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="flex justify-between px-6 pt-4">

          <div class="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden mr-2">
                  <div class="i-tabler-menu-2 size-6"></div>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" class="bg-card p-0!">
                <props.sideNav />
              </SheetContent>
            </Sheet>

            {(props.showSearch ?? true) && (
              <Button variant="outline" class="lg:min-w-64  justify-start" onClick={openCommandPalette}>
                <div class="i-tabler-search size-4 mr-2"></div>
                Search...
              </Button>
            )}
          </div>

          <div class="flex items-center gap-2">
            <Button onClick={promptImport}>
              <div class="i-tabler-upload size-4"></div>
              <span class="hidden sm:inline ml-2">
                Import a document
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base hidden sm:flex" variant="outline" aria-label="Theme switcher">
                <div classList={{ 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' }}></div>
                <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            {user.roles.includes('admin') && (
              <Button as={A} href="/admin">
                <div class="i-tabler-settings size-4 mr-2"></div>
                Admin
              </Button>
            )}

          </div>
        </div>
        <div class="flex-1 overflow-auto max-w-screen">
          <Suspense>
            {props.children}
          </Suspense>
        </div>
      </div>
    </div>
  );
};
